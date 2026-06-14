import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// Lazy-initialize Gemini SDK
let _ai: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY is not configured or has placeholder value. Server will run in Mock AI mode.");
    }
    _ai = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return _ai;
}

// Check if Gemini is fully configured and ready
function isGeminiReady(): boolean {
  try {
    const key = process.env.GEMINI_API_KEY;
    return !!(key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "");
  } catch {
    return false;
  }
}

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    aiEnabled: isGeminiReady(),
  });
});

// 2. AI Job Matcher
app.post("/api/match-jobs", async (req, res) => {
  const { resumeText, profileSkills, jobDescription, jobTitle, companyName } = req.body;

  if (!jobDescription || !jobTitle) {
    res.status(400).json({ error: "Job title and description are required." });
    return;
  }

  // Fallback Mock Logic
  const executeMockMatch = () => {
    const matchScore = Math.floor(Math.random() * 31) + 65; // 65-95%
    const skillsToHighlight = ["React/Vite", "TypeScript", "Tailwind CSS", "UI/UX Design", "REST APIs", "Node.js", "Git"];
    const matched = (profileSkills || []).filter((s: string) => 
      jobDescription.toLowerCase().includes(s.toLowerCase()) || 
      jobTitle.toLowerCase().includes(s.toLowerCase())
    );
    const missed = skillsToHighlight.filter(s => !(profileSkills || []).includes(s)).slice(0, 3);

    return {
      matchScore: matched.length > 0 ? Math.min(100, 70 + matched.length * 8) : matchScore,
      matchingChecklist: [
        { item: `Core Experience with ${jobTitle}`, matched: true },
        ...matched.map((s: string) => ({ item: `Proficiency in ${s}`, matched: true })),
        ...missed.map((s: string) => ({ item: `Expertise in ${s}`, matched: false })),
        { item: "Cultural Fit & Fast Learner Status", matched: true }
      ],
      gapAnalysis: missed.length > 0 ? missed.map(s => `Missing active mention of "${s}" in your profile list.`) : ["Consider structuring your experience bullet points with more quantifiable achievements."],
      tailoredAdvice: [
        `Tailor your headline to highlight target skills matching ${companyName || 'this company'}.`,
        `Add concrete results in your experience to show how you used ${matched.length > 0 ? matched[0] : "your technical stack"}.`,
        "Structure your project catalog to feature products that solved business issues, indicating scale."
      ]
    };
  };

  if (!isGeminiReady()) {
    console.log("Gemini API not ready. Returning high-fidelity mock matching payload.");
    res.json(executeMockMatch());
    return;
  }

  try {
    const ai = getGemini();
    const prompt = `
      Perform a deep professional compatibility matching analysis between a Job Seeker and a job vacancy.
      
      Job seeker characteristics:
      - Skills: ${JSON.stringify(profileSkills || [])}
      - Core Resume Text: ${JSON.stringify(resumeText || "No resume text uploaded. Please match based purely on skills.")}

      Target vacancy details:
      - Job Title: ${jobTitle}
      - Company Name: ${companyName || "Confidential"}
      - Job Description: ${jobDescription}

      Compare them meticulously. Determine an overall compatibility score (0 to 100).
      List concrete items for a skills matching checklist (which elements did they match, which ones are missing).
      Perform a gap analysis of missing skills or misalignments.
      Provide 3-4 highly tailored, actionable recommendations to improve their resume/profile specifically for this job description.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite corporate technical recruiter and resume screening expert. Provide detailed, constructive, realistic insights.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["matchScore", "matchingChecklist", "gapAnalysis", "tailoredAdvice"],
          properties: {
            matchScore: {
              type: Type.INTEGER,
              description: "The overall fit percentage from 0 to 100 based on alignment of skills, level, and description."
            },
            matchingChecklist: {
              type: Type.ARRAY,
              description: "Items representing required/preferred qualifications, labeling whether user possesses them",
              items: {
                type: Type.OBJECT,
                required: ["item", "matched"],
                properties: {
                  item: { type: Type.STRING, description: "The skill, qualification, or experience evaluated" },
                  matched: { type: Type.BOOLEAN, description: "Whether the job seeker meets this requirement" }
                }
              }
            },
            gapAnalysis: {
              type: Type.ARRAY,
              description: "Missing hard skills, concepts, or experience gaps between user profile and job needs.",
              items: { type: Type.STRING }
            },
            tailoredAdvice: {
              type: Type.ARRAY,
              description: "Highly actionable steps user can take to modify resume, acquire skills, or address gaps.",
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Gemini match-jobs error:", err);
    res.json(executeMockMatch());
  }
});

// 3. AI Resume Improver
app.post("/api/improve-resume", async (req, res) => {
  const { currentSkills, experienceText } = req.body;

  if (!experienceText) {
    res.status(400).json({ error: "Experience description text is required." });
    return;
  }

  const executeMockImprove = () => {
    return {
      polishedBulletPoints: [
        "Architected scalable dynamic modules using current frontend web frameworks, improving load performance by 25%.",
        "Collaborated with developers and project designers to streamline system workflows and reduce average response times.",
        "Refactored complex UI components, ensuring accessibility compliance and standardized typography layouts."
      ],
      elevatedSkills: ["Frontend Optimization", "Collaborative Workflows", "System Standards"],
      strategicAdvice: "Inject more action verbs at the start of your bullet points. Quantify statements with indicators such as team sizes, user counts, or performance percentages."
    };
  };

  if (!isGeminiReady()) {
    res.json(executeMockImprove());
    return;
  }

  try {
    const ai = getGemini();
    const prompt = `
      Review the following career experience description:
      "${experienceText}"

      Understood skills list:
      ${JSON.stringify(currentSkills || [])}

      Task:
      Optimize, refine, and professionalize this experience write-up.
      Generate 3 highly impactful, senior-level bullet points formatted as professional accomplishments using the Google X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]" or standard action-oriented professional formatting.
      List 3 elevated skills/keywords that should be highlighted as a result of this experience.
      Provide overall strategic advice to make this portion of the resume shine.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional resume writer and career strategist. Your edits must make the candidate look exceptionally capable and business-outcome oriented.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["polishedBulletPoints", "elevatedSkills", "strategicAdvice"],
          properties: {
            polishedBulletPoints: {
              type: Type.ARRAY,
              description: "Three exquisitely polished, metric-driven accomplishments bullet points.",
              items: { type: Type.STRING }
            },
            elevatedSkills: {
              type: Type.ARRAY,
              description: "Three powerful professional keywords or skill tags demonstrated by this experience.",
              items: { type: Type.STRING }
            },
            strategicAdvice: {
              type: Type.STRING,
              description: "Brief professional insight into how and where to position this on their resume."
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Gemini improve-resume error:", err);
    res.json(executeMockImprove());
  }
});

// 4. cover letter generator
app.post("/api/generate-cover-letter", async (req, res) => {
  const { jobTitle, companyName, recipientName, userBackground, keyPointsToStress } = req.body;

  if (!jobTitle || !companyName || !userBackground) {
    res.status(400).json({ error: "jobTitle, companyName and userBackground are required." });
    return;
  }

  const executeMockCoverLetter = () => {
    return {
      letterText: `Dear Hiring Team at ${companyName},

I am writing with great enthusiasm to express my interest in the ${jobTitle} position. With my background in technology and design, I am confident in my ability to make matching contributions to your team immediately.

Throughout my career, I have developed comprehensive experience in digital design and architecture. I pride myself on solving complex problems, building high-performance components, and collaborating cross-functionally to achieve results. I am particularly excited about ${companyName}'s vision and projects in this field.

Key elements from my background align closely with your requirements:
${(keyPointsToStress || ["Hands-on problem solving", "End-to-end delivery of products", "Passionate technical leadership"]).map((pt: string) => `- ${pt}`).join("\n")}

Thank you for your time and consideration. I welcome the opportunity to discuss how my qualifications align with your engineering needs in greater detail.

Sincerely,
[Your Name]`
    };
  };

  if (!isGeminiReady()) {
    res.json(executeMockCoverLetter());
    return;
  }

  try {
    const ai = getGemini();
    const prompt = `
      Write an elegant, enthusiastic, and highly professional cover letter for the following position:
      - Job Title: ${jobTitle}
      - Company Name: ${companyName}
      - Recipient Name: ${recipientName || "Hiring Team"}
      - Candidate Background: "${userBackground}"
      - Specific points to stress: ${JSON.stringify(keyPointsToStress || [])}

      Create a well-structured letter with formal letter paragraphs. Start with a greeting and an opening paragraph expressing interest.
      Add central paragraph(s) connecting the candidate's background to the job title and stressing the key points.
      End with a call to action and warm signoff. Keep the length balanced and professional (approx 250-350 words).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite career development coach. Write in a warm, sophisticated, compelling business tone. Do not use generic, cheesy templates.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["letterText"],
          properties: {
            letterText: { type: Type.STRING, description: "The full, ready-to-copy text of the cover letter with proper spacing and paragraph breaks." }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Gemini generate-cover-letter error:", err);
    res.json(executeMockCoverLetter());
  }
});

// 5. AI Career & Interview Coach Chat
app.post("/api/chat-coach", async (req, res) => {
  const { history, message, context } = req.body;

  if (!message) {
    res.status(400).json({ error: "Message is required." });
    return;
  }

  const executeMockCoach = () => {
    return {
      text: "That's an excellent question! In interview prep, it is usually useful to structure answers using the STAR format (Situation, Task, Action, Result). Highlight how your specific work boosted outcomes."
    };
  };

  if (!isGeminiReady()) {
    res.json(executeMockCoach());
    return;
  }

  try {
    const ai = getGemini();

    const formattedHistory = (history || []).map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));

    // Adding instructions inside the chat instantiation or generateContent call.
    const systemInstruction = `
      You are 'Coach Avery', an empathetic, high-intelligence AI Career and Interview Coach on the Hyper Jobs platform.
      Your goal is to guide job seekers dynamically.
      Help them practice mock interviews, refine answers to behavioral questions, define career goals, or answer job interview strategy questions.
      Keep responses fairly concise (max 150 words), encouraging, and structured with clean bullet points when explaining complex lists.
      Context: ${context || "Standard job application advice"}
    `;

    const chatInstance = ai.chats.create({
      model: "gemini-3.5-flash",
      history: formattedHistory,
      config: {
        systemInstruction
      }
    });

    const response = await chatInstance.sendMessage({ message });
    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini chat-coach error:", err);
    res.json(executeMockCoach());
  }
});

// Serve frontend assets using Vite on dev or dist files on production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Hyper Jobs Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
