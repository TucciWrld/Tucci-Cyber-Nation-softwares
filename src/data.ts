import { JobPost, SeekerProfile, CompanyProfile, JobApplication } from "./types";

export const INITIAL_SEEKER_PROFILE: SeekerProfile = {
  fullName: "Emma Davis",
  email: "emma769933@gmail.com",
  phone: "+1 (555) 762-8921",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  title: "Frontend React Developer & UI Specialist",
  bio: "Creative frontend specialist passionate about clean reactive state design, fluid layout animations, and accessible web systems. Excited by remote collaborations and AI-infused productivity apps.",
  skills: ["React", "TypeScript", "Tailwind CSS", "Vite", "JavaScript", "HTML5/CSS3", "UI/UX Prototyping", "REST APIs", "Git"],
  experience: [
    {
      id: "exp1",
      company: "Orbit Tech Solutions",
      role: "Mid Frontend Engineer",
      period: "2024 - Present",
      description: "Own development of high-interactivity client dashboards. Integrated modular theme components, boosted page response rates by 35% through custom asset virtualization, and coordinated code reviews."
    },
    {
      id: "exp2",
      company: "Pixel Studio Inc.",
      role: "Associate UI Developer",
      period: "2022 - 2024",
      description: "Implemented high-fidelity mockups using semantic CSS layouts and modular JavaScript. Optimized static pages for responsive mobile breakpoints, enhancing mobile clicks by 20%."
    }
  ],
  education: [
    {
      id: "edu1",
      school: "Western State Institute of Science",
      degree: "Bachelor of Science in Computer Science",
      year: "2018 - 2022"
    }
  ],
  portfolioLinks: ["https://emmadavis.dev", "https://github.com/emmadavis-dev", "https://behance.net/emmadavis-design"],
  resumeText: `EMMA DAVIS
Frontend React Developer & UI Specialist
Email: emma769933@gmail.com | Phone: +1 (555) 762-8921 | Location: San Francisco, CA (Open to Remote)

SUMMARY:
Results-driven Frontend Developer with over 3 years of hands-on experience designing, developing, and deploying accessible web applications. Highly proficient in React, TS, Tailwind CSS, and reactive state management. Focus on fluid UX transitions and high audit performance metrics.

TECHNICAL SKILLS:
- Languages: JavaScript (ES6+), TypeScript, CSS3, HTML5
- Frameworks & tools: React 18, Next.js, Vite, Tailwind CSS, Webpack, Vitest
- Management & API: REST, GraphQL, Redux Toolkit, Context API, Axios

PROFESSIONAL EXPERIENCE:
Mid Frontend Engineer | Orbit Tech Solutions (2024 - Present)
- Built interactive analytics dashboards, utilizing Tailwind and lightweight vector chart libraries (D3/Recharts) to show real-time metrics.
- Boosted client-side performance metrics by 35% using dynamic lazy loading and image asset virtualization hooks.
- Facilitated migration of standard legacy components into fully typed, robust TS React interfaces, removing 95% of unexpected runtime failures.

Associate UI Developer | Pixel Studio Inc. (2022 - 2024)
- Architected reusable design systems components matching custom strict brand regulations, cutting design-to-development turnaround from 14 days to 4 days.
- Designed 100% mobile-responsive interfaces using CSS grids, flex structures, and high-DPI CSS assets.
- Maintained strict accessibility compliance (WCAG AA), introducing keyboard and speech screen-reader focus routing.

EDUCATION:
Western State Institute of Science — B.S. in Computer Science (GPA: 3.8 / 4.0)`,
  resumeFileName: "Emma_Davis_Resume_2026.pdf"
};

export const INITIAL_COMPANY_PROFILE: CompanyProfile = {
  name: "NextGen Labs",
  logo: "⚡",
  tagline: "Empowering the next generation of cloud and AI commerce platforms.",
  description: "NextGen Labs is an agile, multi-award team building highly responsive, distributed commerce API infrastructures and generative UI layers. We champion fully flexible work, inclusive cross-cultural collaboration, and design-led product development.",
  rating: 4.8,
  industry: "Information Technology & AI",
  size: "50 - 200 Employees",
  website: "https://nextgenlabs.ai",
  location: "Austin, TX (With hybrid/remote options)",
};

export const INITIAL_JOBS: JobPost[] = [
  {
    id: "job1",
    title: "Senior React Engineer",
    companyName: "NextGen Labs",
    companyLogo: "⚡",
    location: "Austin, TX (or 100% Remote)",
    salaryRange: "$130k - $160k",
    jobType: "Remote",
    industry: "Information Technology & AI",
    experienceLevel: "Senior Level",
    description: "Looking for an expert React and TypeScript engineer to lead the development of our next-generation visual builder. You'll work closely with design leaders to implement highly responsive canvas builders that integrate flawlessly with client-side state engines.",
    requirements: [
      "5+ years of active software development experience with extensive React expertise.",
      "Expert knowledge of TypeScript, modular bundlers (Vite/Webpack), and advanced CSS systems (Tailwind CSS/PostCSS).",
      "Proven history of building highly interactive web systems (e.g. drag & drop, real-time whiteboards, or visual layout builders).",
      "Strong advocacy for accessible (WCAG AA) markup, clean documentation, and thorough unit testing."
    ],
    benefits: [
      "100% remote workspace with yearly global co-working and meetup stipends.",
      "Top-tier zero-premium healthcare coverage + dental and vision packs.",
      "Annual technical and learning budget ($3,000/year for materials/courses).",
      "Generative mental health, meditation subscriptions, and generous PTO days."
    ],
    postedAt: "2026-06-11",
    employerId: "recruiter1",
    viewsCount: 245,
    appCount: 18
  },
  {
    id: "job2",
    title: "AI Solutions Architect",
    companyName: "Cognitive Stream",
    companyLogo: "🧠",
    location: "San Francisco, CA (Hybrid)",
    salaryRange: "$150k - $190k",
    jobType: "Hybrid",
    industry: "Artificial Intelligence",
    experienceLevel: "Senior Level",
    description: "We are building the future of predictive analysis and context aggregation. As an AI Solutions Architect, you will design the workflows and structures linking large LLM models with internal transactional relational databases. Perfect for devs eager to execute agentic workflows.",
    requirements: [
      "Master's or extensive senior engineering background in computer intelligence, databases, or cloud structures.",
      "Hands-on expertise utilizing modern AI platforms (e.g., Google Gemini Pro, OpenAI API, LangChain).",
      "Deep understanding of vector databases, prompt structure orchestration, and server-side runtimes (Node.js/Python).",
      "Great business product clarity, converting abstract customer needs into scalable technological strategies."
    ],
    benefits: [
      "Flexible hybrid model (2 days in modern SOMA office, 3 days remote).",
      "Premium equity packets with standard vesting schedules.",
      "State-of-the-art office setups, gourmet meals, and fully paid travel passes."
    ],
    postedAt: "2026-06-12",
    employerId: "recruiter2",
    viewsCount: 198,
    appCount: 7
  },
  {
    id: "job3",
    title: "UI/UX Mobile Product Designer",
    companyName: "Stria Design Studio",
    companyLogo: "🎨",
    location: "New York, NY",
    salaryRange: "$110k - $140k",
    jobType: "Full-time",
    industry: "Creative Design Agency",
    experienceLevel: "Mid Level",
    description: "Join our agency where we design boutique, high-impact brands. You will possess full ownership of design files, user research tracks, and tactile visual prototypes for 3 major client releases under construction.",
    requirements: [
      "3+ years active UI/UX experience designing elegant web and mobile consumer interfaces.",
      "Mastery of Figma (libraries, auto-layouts, custom responsive variables) and interactive wireframing.",
      "A gorgeous portfolio showcasing high-contrast screens, refined typography hierarchies, and mobile user paths.",
      "Understanding of HTML/CSS to coordinate smoothly with front-end engineering teams."
    ],
    benefits: [
      "Flexible working schedule and luxury pet-friendly workspace in Soho.",
      "Quarterly performance-based outcome cash rewards.",
      "Full premium wellness health passes."
    ],
    postedAt: "2026-06-13",
    employerId: "recruiter3",
    viewsCount: 112,
    appCount: 9
  },
  {
    id: "job4",
    title: "Summer Intern - Frontend Developer",
    companyName: "NextGen Labs",
    companyLogo: "⚡",
    location: "Austin, TX (Remote Allowable)",
    salaryRange: "$35 - $45 / hr",
    jobType: "Internship",
    industry: "Information Technology & AI",
    experienceLevel: "Entry Level",
    description: "Eager to break into cloud tech? Our Summer Internship program introduces you to modular frontend engineering in a fast-moving agile product pipeline. You'll contribute direct logic to user-facing pages, working in pair programming structures alongside friendly mentors.",
    requirements: [
      "Active enrollment or recent graduate from an undergraduate CS curriculum or recognized engineering program.",
      "Solid fundamental JS/HTML/CSS comprehension. Familiarity with React is highly appreciated.",
      "Passionate interest in product design, eager to ask questions, check code review logs, and grow.",
      "Collaborative verbal skills."
    ],
    benefits: [
      "Direct internship guidance from Senior industry engineering leads.",
      "Potential transfer pathways into premium full-time roles upon evaluation.",
      "Ergonomic computer setup shipped directly to your door."
    ],
    postedAt: "2026-06-13",
    employerId: "recruiter1",
    viewsCount: 310,
    appCount: 42
  }
];

export const INITIAL_APPLICATIONS: JobApplication[] = [
  {
    id: "app_pre_1",
    jobId: "job1",
    jobTitle: "Senior React Engineer",
    companyName: "NextGen Labs",
    companyLogo: "⚡",
    seekerId: "seeker_init",
    seekerName: "Emma Davis",
    seekerEmail: "emma769933@gmail.com",
    applyDate: "2026-06-11",
    status: "Shortlisted",
    coverLetter: "Hi team! I am Emma Davis, and building fluid interactive interfaces with React and Tailwind is exactly my sweet spot. My work at Orbit Tech Solutions perfectly mirrors the Canvas and high-performance requirements listed in your senior posting, and I am highly excited by what NextGen is constructing.",
    fitScore: 92,
    fitSummary: "Strong technical alignment matching modern React, TS, and Tailwind specifications. Candidate possesses 3 years direct React experience and showcases clear, measurable optimizations. Highly suitable for senior technical consideration."
  },
  {
    id: "app_pre_empty",
    jobId: "job4",
    jobTitle: "Summer Intern - Frontend Developer",
    companyName: "NextGen Labs",
    companyLogo: "⚡",
    seekerId: "seeker_other_1",
    seekerName: "Lucas Vance",
    seekerEmail: "lucasvance@uni.edu",
    applyDate: "2026-06-12",
    status: "Reviewing",
    coverLetter: "Hello NextGen, I'm lucas and I am in my junior CS year. I have several project files built with React and HTML. I'd love to join as an intern!",
    fitScore: 78,
    fitSummary: "Basic programming competencies met. Profile demonstrates solid JS fundamentals. Missing deep production experience but indicates great internship enthusiasm."
  }
];
