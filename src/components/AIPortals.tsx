import { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Briefcase, 
  RefreshCw, 
  Copy, 
  Check, 
  User, 
  LogOut, 
  BrainCircuit, 
  HelpCircle,
  TrendingUp,
  Award,
  ChevronRight
} from "lucide-react";
import { SeekerProfile, JobPost } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AIPortalsProps {
  profile: SeekerProfile;
  jobs: JobPost[];
  selectedJobForAnalysis?: JobPost;
  onProfileUpdate: (updated: SeekerProfile) => void;
}

export function AIPortals({ profile, jobs, selectedJobForAnalysis, onProfileUpdate }: AIPortalsProps) {
  const [activeSubTab, setActiveSubTab] = useState<"matcher" | "improver" | "cover" | "coach">(
    selectedJobForAnalysis ? "matcher" : "improver"
  );

  useEffect(() => {
    if (selectedJobForAnalysis) {
      setActiveSubTab("matcher");
      setSelectedJob(selectedJobForAnalysis);
    }
  }, [selectedJobForAnalysis]);

  // States for Matcher
  const [selectedJob, setSelectedJob] = useState<JobPost | undefined>(selectedJobForAnalysis || jobs[0]);
  const [matchingData, setMatchingData] = useState<any | null>(null);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // States for Resume Improver
  const [experienceText, setExperienceText] = useState(
    profile.experience[0]?.description || "Wrote react code for user profile pages to help them browse items."
  );
  const [improvedBulletPoints, setImprovedBulletPoints] = useState<string[]>([]);
  const [elevatedSkills, setElevatedSkills] = useState<string[]>([]);
  const [strategicAdvice, setStrategicAdvice] = useState("");
  const [isImproving, setIsImproving] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [hasAppliedImprover, setHasAppliedImprover] = useState(false);

  // States for Cover Letter
  const [coverJob, setCoverJob] = useState<JobPost | undefined>(jobs[0]);
  const [letterTopic, setLetterTopic] = useState(
    "Interested in joining an innovative UI team. Extensive experience leading clean layout designs and TypeScript refactors."
  );
  const [draftedLetter, setDraftedLetter] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [isLetterCopied, setIsLetterCopied] = useState(false);

  // States for Interview Coach Chat
  const [coachMessages, setCoachMessages] = useState<Array<{ role: "user" | "coach"; text: string }>>([
    {
      role: "coach",
      text: "Hello! I am Coach Avery, your automated interview and career strategy mentor on Hyper Jobs. What job role are we practicing for today, or is there a specific interview question you would like to tackle together?"
    }
  ]);
  const [coachInput, setCoachInput] = useState("");
  const [isCoachTyping, setIsCoachTyping] = useState(false);
  const coachScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    coachScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [coachMessages, isCoachTyping]);

  // Clean matched job helper
  const handleAnalyzeMatch = async () => {
    if (!selectedJob) return;
    setMatchingLoading(true);
    try {
      const res = await fetch("/api/match-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profile.resumeText,
          profileSkills: profile.skills,
          jobTitle: selectedJob.title,
          companyName: selectedJob.companyName,
          jobDescription: selectedJob.description
        })
      });
      const data = await res.json();
      setMatchingData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleImproveResume = async () => {
    if (!experienceText.trim()) return;
    setIsImproving(true);
    try {
      const res = await fetch("/api/improve-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSkills: profile.skills,
          experienceText: experienceText
        })
      });
      const data = await res.json();
      setImprovedBulletPoints(data.polishedBulletPoints || []);
      setElevatedSkills(data.elevatedSkills || []);
      setStrategicAdvice(data.strategicAdvice || "");
      setHasAppliedImprover(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsImproving(false);
    }
  };

  const handleDraftCoverLetter = async () => {
    if (!coverJob) return;
    setIsDrafting(true);
    try {
      const res = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: coverJob.title,
          companyName: coverJob.companyName,
          userBackground: letterTopic,
          keyPointsToStress: profile.skills.slice(0, 3)
        })
      });
      const data = await res.json();
      setDraftedLetter(data.letterText || "");
    } catch (err) {
      console.error(err);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSendCoachMsg = async () => {
    if (!coachInput.trim()) return;
    const userMsg = coachInput;
    setCoachInput("");
    setCoachMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsCoachTyping(true);

    try {
      const payloadHistory = coachMessages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        text: m.text
      }));

      const res = await fetch("/api/chat-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: payloadHistory,
          message: userMsg,
          context: `Candidate Name: ${profile.fullName}, Skills: ${profile.skills.join(", ")}, Target Career Goal: ${profile.title}`
        })
      });
      const data = await res.json();
      setCoachMessages(prev => [...prev, { role: "coach", text: data.text || "I am processing your query. Could you tell me more?" }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCoachTyping(false);
    }
  };

  const copyToClipboard = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (typeof index === "number") {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      setIsLetterCopied(true);
      setTimeout(() => setIsLetterCopied(false), 2000);
    }
  };

  const applyBulletToProfile = (bullet: string) => {
    // Add polished bullet point to current profile experience
    const updatedExp = [...profile.experience];
    if (updatedExp[0]) {
      updatedExp[0].description += "\n- " + bullet;
      onProfileUpdate({
        ...profile,
        experience: updatedExp
      });
      alert("Bullet point attached to your Profile's primary experience field!");
    } else {
      alert("No work experience cards configured on your profile! Build one to attach.");
    }
  };

  const addElevatedSkill = (skill: string) => {
    if (profile.skills.includes(skill)) return;
    onProfileUpdate({
      ...profile,
      skills: [...profile.skills, skill]
    });
    alert(`Added "${skill}" to your professional skills list!`);
  };

  return (
    <div id="ai_tools_hub" className="bg-[#0c0c0c] border border-white/10 rounded-none overflow-hidden">
      {/* Banner */}
      <div className="bg-black px-6 py-6 border-b border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-zinc-900 border border-white/10 rounded-none text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                Gemini AI Career Suite
              </h2>
              <p className="text-zinc-400 text-xs mt-1">
                Elevate your job search and stand out to recruiters with on-demand intelligence.
              </p>
            </div>
          </div>
          {/* Menu */}
          <div className="flex flex-wrap gap-1 bg-black p-1 rounded-none border border-white/10">
            <button
              id="ai_nav_improver"
              onClick={() => setActiveSubTab("improver")}
              className={`px-3 py-1.5 text-[9px] uppercase tracking-widest font-black rounded-none transition-all ${
                activeSubTab === "improver"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Resume Improver
            </button>
            <button
              id="ai_nav_matcher"
              onClick={() => {
                setActiveSubTab("matcher");
                if (!matchingData && selectedJob) handleAnalyzeMatch();
              }}
              className={`px-3 py-1.5 text-[9px] uppercase tracking-widest font-black rounded-none transition-all ${
                activeSubTab === "matcher"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Vacancy Fit Matcher
            </button>
            <button
              id="ai_nav_cover"
              onClick={() => setActiveSubTab("cover")}
              className={`px-3 py-1.5 text-[9px] uppercase tracking-widest font-black rounded-none transition-all ${
                activeSubTab === "cover"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Cover Letter Writer
            </button>
            <button
              id="ai_nav_coach"
              onClick={() => setActiveSubTab("coach")}
              className={`px-3 py-1.5 text-[9px] uppercase tracking-widest font-black rounded-none transition-all ${
                activeSubTab === "coach"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Interview Mentor
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* TAB 1: RESUME IMPROVER */}
        {activeSubTab === "improver" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#999] mb-1.5">
                  Describe a Work Experience Bullet or Concept
                </label>
                <p className="text-zinc-500 text-xs mb-2">
                  Draft what you did in past roles. We'll leverage Gemini to generate impact-oriented outcomes.
                </p>
                <textarea
                  id="resume_draft_box"
                  value={experienceText}
                  onChange={(e) => setExperienceText(e.target.value)}
                  className="w-full h-40 bg-black text-white border border-white/10 rounded-none p-3 text-xs focus:outline-none focus:border-white placeholder:text-zinc-650"
                  placeholder="e.g., I worked on backend models and wrote SQL tables to maintain standard logs."
                />
              </div>

              <button
                id="btn_improve_resume"
                disabled={isImproving || !experienceText.trim()}
                onClick={handleImproveResume}
                className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 hover:text-black hover:border-black transition-all text-[10px] font-black uppercase tracking-widest rounded-none flex items-center justify-center gap-2 shadow disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {isImproving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Improving with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Optimize Bullet Point
                  </>
                )}
              </button>

              <div className="bg-[#141414] border border-white/5 rounded-none p-4">
                <span className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> High Impact Tips
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Focus your draft on actions. Let Gemini formulate the measurement and outcome metrics.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-between bg-black border border-white/10 rounded-none p-5 min-h-[300px]">
              {!hasAppliedImprover && !isImproving ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <FileText className="w-12 h-12 text-zinc-700 mb-3" />
                  <h3 className="text-zinc-300 font-bold text-xs uppercase tracking-wider">Nothing Polished Yet</h3>
                  <p className="text-zinc-500 text-[11px] max-w-sm mt-1">
                    Paste some experience bullet drafts on the left side, and tap "Optimize Bullet Point".
                  </p>
                </div>
              ) : isImproving ? (
                <div className="flex flex-col items-center justify-center h-full py-10 space-y-3">
                  <div className="relative">
                    <BrainCircuit className="w-12 h-12 text-zinc-400 animate-pulse" />
                    <Sparkles className="w-6 h-6 text-white absolute -top-1.5 -right-1.5 animate-bounce" />
                  </div>
                  <p className="text-zinc-300 text-[9px] tracking-widest uppercase font-black animate-pulse">
                    Refining with Gemini Intelligence...
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 mb-3">
                      <CheckCircle className="w-4 h-4 text-white" /> Professional Grade Formulations
                    </h3>
                    <div className="space-y-3">
                      {improvedBulletPoints.map((bullet, idx) => (
                        <div 
                           key={idx} 
                           className="group relative bg-[#111] border border-white/10 hover:border-white rounded-none p-4.5 text-xs text-zinc-300 leading-relaxed transition-all"
                        >
                          <p className="pr-16">{bullet}</p>
                          <div className="absolute right-3 top-3 flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              title="Copy bullet"
                              onClick={() => copyToClipboard(bullet, idx)}
                              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-none transition"
                            >
                              {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              title="Add to Profile"
                              onClick={() => applyBulletToProfile(bullet)}
                              className="px-2 py-1 bg-white text-black hover:bg-zinc-200 rounded-none text-[9px] uppercase tracking-widest font-black transition"
                            >
                              Use
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {elevatedSkills.length > 0 && (
                    <div>
                      <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                        Elevated Keywords & Skills to Highlight:
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {elevatedSkills.map((sk, id) => (
                          <button
                            key={id}
                            onClick={() => addElevatedSkill(sk)}
                            className="bg-black border border-white/10 hover:border-white text-zinc-300 px-2.5 py-1.5 rounded-none text-xs transition flex items-center gap-1 font-mono uppercase text-[9px]"
                          >
                            + {sk}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {strategicAdvice && (
                    <div className="bg-[#141414] border border-white/5 p-3.5 rounded-none text-xs">
                      <span className="font-bold text-white uppercase tracking-wider text-[10px] block mb-1">Coach Insight: </span>
                      <span className="text-zinc-400 font-sans leading-relaxed">{strategicAdvice}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FIT MATCHER */}
        {activeSubTab === "matcher" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-[#111] p-5 border border-white/10 rounded-none">
              <div className="flex-1">
                <label className="block text-[9px] font-black uppercase text-[#999] tracking-widest mb-2">
                  Select a Job Vacancy for Deep AI Alignment Analysis
                </label>
                <select
                  id="match_post_selector"
                  value={selectedJob?.id || ""}
                  onChange={(e) => {
                    const found = jobs.find(j => j.id === e.target.value);
                    setSelectedJob(found);
                    setMatchingData(null);
                  }}
                  className="w-full max-w-md bg-black text-white border border-white/10 rounded-none p-2.5 text-xs font-mono focus:outline-none focus:border-white"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} — {j.companyName} ({j.jobType})
                    </option>
                  ))}
                </select>
              </div>

              <button
                id="btn_run_match"
                disabled={matchingLoading || !selectedJob}
                onClick={handleAnalyzeMatch}
                className="py-2.5 px-6 bg-white text-black hover:bg-zinc-200 transition text-[10px] uppercase tracking-widest font-black rounded-none flex items-center justify-center gap-2 shadow disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {matchingLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Screening Resume...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-4 h-4" /> Run Deep AI Match
                  </>
                )}
              </button>
            </div>

            {matchingLoading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-black border border-white/10 rounded-none">
                <div className="relative">
                  <BrainCircuit className="w-12 h-12 text-zinc-400 animate-bounce" />
                  <Sparkles className="w-6 h-6 text-white absolute -top-1 -right-1 animate-pulse" />
                </div>
                <p className="text-zinc-300 text-[9px] tracking-widest uppercase font-black animate-pulse">
                  Gemini analyzing skills, background and job profile...
                </p>
              </div>
            ) : matchingData ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 leading-relaxed">
                {/* Left column score & list */}
                <div className="md:col-span-4 bg-black border border-white/10 rounded-none p-6 flex flex-col items-center text-center justify-center">
                  <div className="relative flex items-center justify-center mb-5">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        className="stroke-zinc-800"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        className="stroke-white transition-all duration-1000"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 52}
                        strokeDashoffset={2 * Math.PI * 52 * (1 - (matchingData.matchScore || 0) / 100)}
                        strokeLinecap="square"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-extrabold text-white">{matchingData.matchScore}%</span>
                      <span className="text-[9px] text-[#999] font-black tracking-widest uppercase mt-0.5">Match Score</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-black uppercase tracking-wider text-white mb-1">{selectedJob?.title}</h3>
                  <p className="text-zinc-400 text-xs mb-3">{selectedJob?.companyName}</p>

                  <div className="w-full pt-4 border-t border-white/10 text-left">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Evaluated Checks</span>
                    <div className="space-y-2">
                      {matchingData.matchingChecklist?.map((chk: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs">
                          {chk.matched ? (
                            <CheckCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                          )}
                          <span className={chk.matched ? "text-zinc-300" : "text-zinc-600 line-through"}>{chk.item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right columns gaps & advice */}
                <div className="md:col-span-8 space-y-5">
                  <div className="bg-black border border-white/10 p-5 rounded-none">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 mb-3">
                      <XCircle className="w-4 h-4 text-zinc-500" /> Identified Profile Gaps
                    </h3>
                    <ul className="space-y-2 list-none">
                      {matchingData.gapAnalysis?.map((gap: string, id: number) => (
                        <li key={id} className="text-xs text-zinc-300 flex items-start gap-2">
                          <span className="text-white font-extrabold shrink-0 mt-0.5">&bull;</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-black border border-white/10 p-5 rounded-none font-sans">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 mb-3">
                      <Award className="w-4 h-4 text-white" /> Tailored Profile Optimization Steps
                    </h3>
                    <div className="space-y-3">
                      {matchingData.tailoredAdvice?.map((adv: string, id: number) => (
                        <div key={id} className="flex gap-3 text-xs bg-[#111] p-3.5 rounded-none border border-white/5">
                          <span className="h-5 w-5 bg-white text-black flex items-center justify-center font-black shrink-0 text-[10px] tracking-tight">
                            {id + 1}
                          </span>
                          <span className="text-zinc-300 font-sans leading-relaxed">{adv}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-black border border-white/10 rounded-none">
                <BrainCircuit className="w-12 h-12 text-zinc-700 mb-2" />
                <h3 className="text-zinc-300 font-bold text-xs uppercase tracking-wider">Ready for deep analysis</h3>
                <p className="text-zinc-450 text-[11px] max-w-sm mt-1 leading-relaxed">
                  Choose any listed vacancy and trigger the AI Match engine to extract compatibility score and strategic resume revisions.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COVER LETTER */}
        {activeSubTab === "cover" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#999] mb-1.5">
                  Select Associated Position
                </label>
                <select
                  value={coverJob?.id || ""}
                  onChange={(e) => {
                    const found = jobs.find(j => j.id === e.target.value);
                    setCoverJob(found);
                  }}
                  className="w-full bg-black text-white border border-white/10 rounded-none p-2.5 text-xs font-mono focus:outline-none"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} — {j.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#999] mb-1.5">
                  Your core story / points to highlight
                </label>
                <textarea
                  value={letterTopic}
                  onChange={(e) => setLetterTopic(e.target.value)}
                  className="w-full h-32 bg-black text-white border border-white/10 rounded-none p-3 text-xs focus:outline-none focus:border-white leading-relaxed"
                  placeholder="Tell Gemini what specific angle or key passion to highlight in the cover letter..."
                />
              </div>

              <button
                id="btn_draft_cover"
                disabled={isDrafting || !coverJob}
                onClick={handleDraftCoverLetter}
                className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 transition text-[10px] uppercase tracking-widest font-black rounded-none flex items-center justify-center gap-2 shadow disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {isDrafting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Drafting Letter with Gemini...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" /> Draft Cover Letter
                  </>
                )}
              </button>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-between bg-black border border-white/10 rounded-none p-5 min-h-[300px]">
              {!draftedLetter && !isDrafting ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <FileText className="w-12 h-12 text-zinc-700 mb-3" />
                  <h3 className="text-zinc-300 font-bold text-xs uppercase tracking-wider">No Draft Created</h3>
                  <p className="text-zinc-500 text-[11px] max-w-sm mt-1 leading-relaxed">
                    Select a target job, review/update your story, and tap "Draft Cover Letter" to output.
                  </p>
                </div>
              ) : isDrafting ? (
                <div className="flex flex-col items-center justify-center h-full py-16 space-y-3">
                  <BrainCircuit className="w-12 h-12 text-zinc-400 animate-pulse" />
                  <p className="text-zinc-300 text-[9px] tracking-widest uppercase font-black animate-pulse">
                    Crafting custom letter matching profile skills...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-white text-[9px] font-black uppercase tracking-widest">
                      Tailored Letter Output
                    </span>
                    <button
                      onClick={() => copyToClipboard(draftedLetter)}
                      className="px-3 py-1.5 bg-[#111] border border-white/10 text-zinc-300 hover:text-white rounded-none text-xs flex items-center gap-1.5"
                    >
                      {isLetterCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Letter
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-[#111] border border-white/10 p-4 rounded-none text-xs leading-relaxed text-zinc-300 font-mono whitespace-pre-wrap max-h-[350px] overflow-y-auto">
                    {draftedLetter}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MOCK INTERVIEW CHAT */}
        {activeSubTab === "coach" && (
          <div className="space-y-4">
            <div className="bg-black border border-white/10 rounded-none p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-white uppercase tracking-widest text-xs shrink-0">
                A
              </div>
              <div>
                <h4 className="text-white text-xs font-black uppercase tracking-wider">Coach Avery</h4>
                <p className="text-zinc-450 text-[11px]">AI Interview Advisor & Career Strategist • Real-time mock simulator</p>
              </div>
            </div>

            <div className="bg-black border border-white/10 rounded-none p-4 h-[350px] overflow-y-auto space-y-4">
              {coachMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-none p-4 text-xs leading-relaxed border ${
                      msg.role === "user"
                        ? "bg-white text-black border-white"
                        : "bg-[#111] border-white/10 text-zinc-200"
                    }`}
                  >
                    <span className="block text-[8.5px] uppercase tracking-widest font-black opacity-60 mb-1 font-mono">
                      {msg.role === "user" ? "Applicant" : "Coach Avery"}
                    </span>
                    <p className="whitespace-pre-line font-sans leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}

              {isCoachTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#111] border border-white/10 text-zinc-200 rounded-none p-4">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-1.5 h-1.5 rounded-none bg-white animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-none bg-white animate-bounce delay-100" />
                      <span className="w-1.5 h-1.5 rounded-none bg-white animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={coachScrollRef} />
            </div>

            <div className="flex gap-2">
              <input
                id="coach_input_field"
                type="text"
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendCoachMsg()}
                className="flex-1 bg-black text-white border border-white/10 rounded-none px-4 py-2.5 text-xs focus:outline-none focus:border-white font-sans"
                placeholder="Ask Avery a question, or practice interview questions..."
              />
              <button
                id="btn_send_coach_msg"
                onClick={handleSendCoachMsg}
                disabled={!coachInput.trim() || isCoachTyping}
                className="px-4 py-2.5 bg-white hover:bg-zinc-200 transition text-black font-black uppercase tracking-widest text-[10px] rounded-none flex items-center justify-center shadow shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
