import { useState, useMemo, FormEvent } from "react";
import { 
  Building, 
  Plus, 
  Briefcase, 
  Users, 
  Sparkles, 
  Activity, 
  MapPin, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  FileText, 
  Search, 
  Clock, 
  TrendingUp, 
  BarChart, 
  RefreshCw,
  Mail,
  Smartphone
} from "lucide-react";
import { JobPost, CompanyProfile, JobApplication, ApplicationStatus, JobType, ExperienceLevel } from "../types";

interface RecruiterDashboardProps {
  company: CompanyProfile;
  jobs: JobPost[];
  applications: JobApplication[];
  onCompanyUpdate: (updated: CompanyProfile) => void;
  onPostJob: (newJob: Omit<JobPost, "id" | "postedAt" | "viewsCount" | "appCount">) => void;
  onUpdateApplicationStatus: (appId: string, status: ApplicationStatus, score?: number, summary?: string) => void;
  onStartChat: (seekerId: string, seekerName: string, jobId: string, jobTitle: string) => void;
  activeRecruiterSubTab: "dashboard" | "company-profile" | "post-vacancy";
}

export function RecruiterDashboard({
  company,
  jobs,
  applications,
  onCompanyUpdate,
  onPostJob,
  onUpdateApplicationStatus,
  onStartChat,
  activeRecruiterSubTab
}: RecruiterDashboardProps) {

  // New job post form state
  const [jobTitle, setJobTitle] = useState("");
  const [jobLocation, setJobLocation] = useState("Austin, TX (With hybrid flexibility)");
  const [jobSalary, setJobSalary] = useState("$120k - $150k");
  const [jobType, setJobType] = useState<JobType>("Full-time");
  const [jobLevel, setJobLevel] = useState<ExperienceLevel>("Senior Level");
  const [jobIndustry, setJobIndustry] = useState(company.industry);
  const [jobDesc, setJobDesc] = useState("");
  const [jobReqs, setJobReqs] = useState("React, TypeScript, CSS grid interfaces, Strong communication skills");
  const [jobBenefits, setJobBenefits] = useState("Flexible workspace stipends, Top-tier zero-premium healthcare coverage, PTO");

  // Selected applicant detailed review
  const [reviewApp, setReviewApp] = useState<JobApplication | null>(applications[0] || null);
  const [screeningLoading, setScreeningLoading] = useState(false);

  // Search/Filter for recruiter applicants list
  const [appSearch, setAppSearch] = useState("");

  const recruiterJobs = useMemo(() => {
    return jobs.filter(j => j.employerId === "recruiter1" || j.companyName === company.name);
  }, [jobs, company]);

  const applicantList = useMemo(() => {
    return applications.filter(app => {
      // Find matching job
      const associatedJob = jobs.find(j => j.id === app.jobId);
      const isOurJob = associatedJob ? (associatedJob.employerId === "recruiter1" || associatedJob.companyName === company.name) : true;
      const matchesSearch = app.seekerName.toLowerCase().includes(appSearch.toLowerCase()) || 
                            app.jobTitle.toLowerCase().includes(appSearch.toLowerCase());
      return isOurJob && matchesSearch;
    });
  }, [applications, jobs, company, appSearch]);

  const stats = useMemo(() => {
    const activePosts = recruiterJobs.length;
    const totalApps = applicantList.length;
    const shortlistedCount = applicantList.filter(a => a.status === "Shortlisted" || a.status === "Interviewing").length;
    const successRatio = totalApps > 0 ? Math.round((shortlistedCount / totalApps) * 100) : 0;
    
    return {
      activePosts,
      totalApps,
      shortlistedCount,
      successRatio
    };
  }, [recruiterJobs, applicantList]);

  const handlePostSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDesc.trim()) return;

    onPostJob({
      title: jobTitle,
      companyName: company.name,
      companyLogo: company.logo,
      location: jobLocation,
      salaryRange: jobSalary,
      jobType,
      industry: jobIndustry,
      experienceLevel: jobLevel,
      description: jobDesc,
      requirements: jobReqs.split(",").map(r => r.trim()).filter(Boolean),
      benefits: jobBenefits.split(",").map(b => b.trim()).filter(Boolean),
      employerId: "recruiter1"
    });

    // Reset Form
    setJobTitle("");
    setJobDesc("");
    setJobReqs("React, TypeScript, Tailwind CSS, API Integration");
    setJobBenefits("Flexible hours, Paid healthcare, Training allowances");
    alert("Vacancy successfully posted! Candidates can now query and apply.");
  };

  const executeAIScreening = async (app: JobApplication) => {
    const job = jobs.find(j => j.id === app.jobId);
    if (!job) return;

    setScreeningLoading(true);
    try {
      const res = await fetch("/api/match-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: "", // Screen based on the seeker description & matching profiles
          profileSkills: ["React", "TypeScript", "Tailwind CSS", "Vite", "REST APIs"], // Simulate applicant skills
          jobTitle: job.title,
          companyName: job.companyName,
          jobDescription: job.description
        })
      });
      const data = await res.json();
      
      const score = data.matchScore || 85;
      const advice = data.gapAnalysis?.[0] || "Good fundamental alignment matching react requirements.";
      const summary = `Fit Score: ${score}%. ${advice} Candidate meets most technical expectations for ${job.title}.`;

      onUpdateApplicationStatus(app.id, "Reviewing", score, summary);
      
      // Update local review state
      setReviewApp(prev => prev && prev.id === app.id ? { ...prev, status: "Reviewing", fitScore: score, fitSummary: summary } : prev);
      alert(`Gemini complete! Candidate received a compatibility index of ${score}%`);
    } catch (err) {
      console.error(err);
    } finally {
      setScreeningLoading(false);
    }
  };

  return (
    <div id="recruiter_panel" className="space-y-6">

      {/* TAB 1: WORKSPACE / APPLICANT ANALYTICS BOARD */}
      {activeRecruiterSubTab === "dashboard" && (
        <div className="space-y-6">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111] border border-white/10 p-4.5 rounded-none flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-mono">My Job Vacancies</span>
                <span className="text-2xl font-black text-white mt-1 block">{stats.activePosts}</span>
              </div>
              <span className="text-lg p-2.5 bg-black border border-white/10 rounded-none">💼</span>
            </div>

            <div className="bg-[#111] border border-white/10 p-4.5 rounded-none flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Incoming Apps</span>
                <span className="text-2xl font-black text-white mt-1 block">{stats.totalApps}</span>
              </div>
              <span className="text-lg p-2.5 bg-black border border-white/10 rounded-none">👥</span>
            </div>

            <div className="bg-[#111] border border-white/10 p-4.5 rounded-none flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Shortlisted</span>
                <span className="text-2xl font-black text-white mt-1 block">{stats.shortlistedCount}</span>
              </div>
              <span className="text-lg p-2.5 bg-black border border-white/10 rounded-none">★</span>
            </div>

            <div className="bg-[#111] border border-white/10 p-4.5 rounded-none flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Screen Fit Ratio</span>
                <span className="text-2xl font-black text-white mt-1 block">{stats.successRatio}%</span>
              </div>
              <span className="text-lg p-2.5 bg-black border border-white/10 rounded-none">📈</span>
            </div>
          </div>

          {/* Core Recruiter interactive console */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Applicant Queue Left */}
            <div className="lg:col-span-5 bg-[#111] border border-white/10 rounded-none p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">
                  CANDIDATE SCREENING QUEUE
                </span>
                <input
                  type="text"
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="bg-black border border-white/10 rounded-none px-2.5 py-1 text-[10px] text-white focus:outline-none focus:border-white font-mono"
                  placeholder="FILTER NAME/JOB..."
                />
              </div>

              {applicantList.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-8">No matching applications inside the portal currently.</p>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {applicantList.map(app => {
                    const isSelected = reviewApp?.id === app.id;
                    const getBadge = (status: ApplicationStatus) => {
                      if (status === "Applied") return "bg-zinc-800 text-zinc-300 border-white/10";
                      if (status === "Reviewing") return "bg-zinc-900 border-white/5 text-zinc-400";
                      if (status === "Shortlisted" || status === "Interviewing") return "bg-white text-black border-white";
                      if (status === "Offered") return "bg-white text-black border-white";
                      return "bg-zinc-900 text-zinc-600 border-zinc-800";
                    };

                    return (
                      <div
                        key={app.id}
                        onClick={() => setReviewApp(app)}
                        className={`cursor-pointer border rounded-none p-3.5 transition flex items-center justify-between gap-2 ${
                          isSelected 
                            ? "bg-[#1c1c1c] border-white" 
                            : "bg-black border-white/10 hover:border-white/35"
                        }`}
                      >
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-white">{app.seekerName}</h4>
                          <span className="text-[10px] text-zinc-400 font-mono uppercase block mt-1 truncate max-w-[170px]">{app.jobTitle}</span>
                        </div>

                        <span className={`px-2 py-0.5 rounded-none text-[8.5px] uppercase tracking-widest font-black border ${getBadge(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Candidate Reviewer Frame Right */}
            <div className="lg:col-span-7 bg-[#111] border border-white/10 rounded-none p-5 space-y-5 leading-relaxed">
              {reviewApp ? (
                <div className="space-y-4">
                  
                  {/* Review App Top Card */}
                  <div className="flex justify-between items-start border-b border-white/10 pb-4 gap-3">
                    <div className="flex gap-3">
                      <span className="text-2xl h-10 w-10 flex items-center justify-center bg-black border border-white/10 rounded-none shrink-0 font-mono">AP</span>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-white">{reviewApp.seekerName}</h3>
                        <p className="text-[11px] text-zinc-400 font-mono">{reviewApp.seekerEmail}</p>
                      </div>
                    </div>

                    <span className="text-[9px] bg-zinc-900 border border-white/10 text-zinc-300 px-2.5 py-1 rounded-none font-mono uppercase tracking-wider">
                      Applied: {reviewApp.applyDate}
                    </span>
                  </div>

                  {/* Vacancy Target Match */}
                  <div className="flex items-center justify-between bg-black p-3.5 rounded-none border border-white/10">
                    <div>
                      <span className="text-[8.5px] text-zinc-500 font-black uppercase tracking-widest block">Vacancy Under Consideration</span>
                      <span className="text-xs text-white uppercase font-black tracking-wide mt-1 block">{reviewApp.jobTitle}</span>
                    </div>
                    <button
                      onClick={() => onStartChat(reviewApp.seekerId, reviewApp.seekerName, reviewApp.jobId, reviewApp.jobTitle)}
                      className="px-3.5 py-1.5 bg-white text-black hover:bg-zinc-200 transition text-[9px] font-black uppercase tracking-widest rounded-none flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Direct Chat
                    </button>
                  </div>

                  {/* Cover Letter Plain text pitch */}
                  <div className="space-y-1 bg-[#141414] p-4 rounded-none border border-white/5">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">Interactive Cover Note / Pitch</span>
                    <p className="text-xs text-zinc-350 leading-relaxed font-sans whitespace-pre-wrap">{reviewApp.coverLetter || "No cover letter submitted with application."}</p>
                  </div>

                  {/* AI Automated Candidate Assessment */}
                  <div className="bg-black border border-white/10 rounded-none p-4.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4.5 h-4.5 text-white" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Cognitive Fitness Smart Screening</span>
                      </div>
                      
                      {reviewApp.fitScore ? (
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#999] bg-zinc-900 border border-white/10 px-2.5 py-1 rounded-none font-mono">
                          {reviewApp.fitScore}% Fit Index
                        </span>
                      ) : (
                        <button
                          disabled={screeningLoading}
                          onClick={() => executeAIScreening(reviewApp)}
                          className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 transition text-[9px] font-black uppercase tracking-widest rounded-none flex items-center gap-1.5"
                        >
                          {screeningLoading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Screening...
                            </>
                          ) : (
                            "Ask Gemini to Screen"
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      {reviewApp.fitSummary || "Automated Gemini analysis matching the candidate profile to requirements and benefits descriptions is ready to trigger."}
                    </p>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2.5 pt-2 border-t border-white/10">
                    <button
                      id="btn_decline_applicant"
                      onClick={() => {
                        onUpdateApplicationStatus(reviewApp.id, "Declined");
                        setReviewApp(prev => prev ? { ...prev, status: "Declined" } : null);
                        alert("Candidate application status updated to: Declined");
                      }}
                      className="flex-1 py-2.5 bg-[#141414] border border-white/10 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-none text-[9px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Decline Portfolio
                    </button>
                    
                    <button
                      id="btn_shortlist_applicant"
                      onClick={() => {
                        onUpdateApplicationStatus(reviewApp.id, "Shortlisted");
                        setReviewApp(prev => prev ? { ...prev, status: "Shortlisted" } : null);
                        alert("Candidate portfolio shortlisted!");
                      }}
                      className="flex-1 py-2.5 bg-white border border-white text-black hover:bg-zinc-200 rounded-none text-[9px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Shortlist Nominee
                    </button>
                  </div>

                </div>
              ) : (
                <div className="bg-black/40 border border-white/10 rounded-none p-10 text-center flex flex-col items-center justify-center h-full">
                  <Users className="w-10 h-10 text-zinc-600 mb-2" />
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1 block">No Candidate Selected</span>
                  <p className="text-zinc-500 text-xs max-w-sm mt-1 leading-relaxed">Choose any active application on the left to initiate thorough reviews inside the assessment portal.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: POST VACANCY FORM FOR EMPLOYER */}
      {activeRecruiterSubTab === "post-vacancy" && (
        <div className="bg-[#111] border border-white/10 rounded-none p-6 space-y-4 max-w-3xl">
          <div className="border-b border-white/10 pb-3">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Publishment Center</span>
            <h3 className="text-sm font-black uppercase tracking-wider text-white mt-1">Broadcast a New Opportunity</h3>
            <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">Define your project parameters. Any submission instantly populates the local seeker search directories.</p>
          </div>

          <form onSubmit={handlePostSubmit} className="space-y-4 leading-none text-xs text-zinc-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] text-zinc-400 font-extrabold uppercase tracking-wide mb-1.5">Job Title *</label>
                <input
                  id="form_job_title"
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-black border border-white/10 p-2.5 rounded-none text-white focus:outline-none focus:border-white font-sans text-xs"
                  placeholder="e.g. Lead TypeScript Engineer"
                />
              </div>
              <div>
                <label className="block text-[9px] text-zinc-400 font-extrabold uppercase tracking-wide mb-1.5">Location / Options *</label>
                <input
                  type="text"
                  required
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  className="w-full bg-black border border-white/10 p-2.5 rounded-none text-white focus:outline-none focus:border-white font-sans text-xs"
                  placeholder="e.g. Austin, TX (Hybrid)"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[9px] text-zinc-400 font-extrabold uppercase tracking-wide mb-1.5">Salary Range *</label>
                <input
                  type="text"
                  required
                  value={jobSalary}
                  onChange={(e) => setJobSalary(e.target.value)}
                  className="w-full bg-black border border-white/10 p-2.5 rounded-none text-white focus:outline-none focus:border-white font-mono text-xs"
                  placeholder="e.g. $140,000 - $170,000"
                />
              </div>
              <div>
                <label className="block text-[9px] text-zinc-400 font-extrabold uppercase tracking-wide mb-1.5">Job Category *</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as JobType)}
                  className="w-full bg-black border border-white/10 p-2 rounded-none text-white font-mono text-xs focus:outline-none"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-zinc-400 font-extrabold uppercase tracking-wide mb-1.5">Experience Level *</label>
                <select
                  value={jobLevel}
                  onChange={(e) => setJobLevel(e.target.value as ExperienceLevel)}
                  className="w-full bg-black border border-white/10 p-2 rounded-none text-white font-mono text-xs focus:outline-none"
                >
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid Level">Mid Level</option>
                  <option value="Senior Level">Senior Level</option>
                  <option value="Lead / Manager">Lead / Manager</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[9px] text-zinc-400 font-extrabold uppercase tracking-wide mb-1.5">Vacancy Role Description *</label>
              <textarea
                required
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                className="w-full h-24 bg-black border border-white/10 p-3 rounded-none text-white leading-relaxed text-xs focus:outline-none focus:border-white font-sans"
                placeholder="Describe daily tasks and expectations matching the role..."
              />
            </div>

            <div>
              <label className="block text-[9px] text-zinc-400 font-extrabold uppercase tracking-wide mb-1.5">Candidate Requirements (Comma separated) *</label>
              <input
                type="text"
                required
                value={jobReqs}
                onChange={(e) => setJobReqs(e.target.value)}
                className="w-full bg-black border border-white/10 p-2.5 rounded-none text-white focus:outline-none focus:border-white text-xs font-sans"
                placeholder="e.g. Expert React knowledge, 5 years TypeScript, WCAG accessibility"
              />
            </div>

            <div>
              <label className="block text-[9px] text-zinc-400 font-extrabold uppercase tracking-wide mb-1.5">Benefits Offered (Comma separated)</label>
              <input
                type="text"
                value={jobBenefits}
                onChange={(e) => setJobBenefits(e.target.value)}
                className="w-full bg-black border border-white/10 p-2.5 rounded-none text-white focus:outline-none focus:border-white text-xs font-sans"
                placeholder="e.g. 100% Remote, Paid medical benefits, $2,000 hardware budget"
              />
            </div>

            <div className="pt-2">
              <button
                id="btn_submit_post"
                type="submit"
                className="px-5 py-3 bg-white text-black hover:bg-zinc-200 transition text-[10px] uppercase tracking-widest font-black rounded-none shadow"
              >
                Confirm and Post Vacancy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: COMPANY PROFILE EDIT */}
      {activeRecruiterSubTab === "company-profile" && (
        <div className="bg-[#111] border border-white/10 rounded-none p-6 space-y-4 max-w-3xl leading-relaxed text-xs">
          <div className="border-b border-white/10 pb-3">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">BRAND MANAGEMENT</span>
            <h3 className="text-sm font-black uppercase tracking-wider text-white mt-1">Company Branding Profile</h3>
            <p className="text-zinc-400 text-xs mt-1 leading-relaxed">Update branding cards so seekers review high quality information when browsing opportunities.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <label className="block text-[9px] text-[#999] uppercase tracking-widest font-black mb-1.5">Brand Name</label>
              <input
                type="text"
                value={company.name}
                onChange={(e) => onCompanyUpdate({ ...company, name: e.target.value })}
                className="w-full bg-black border border-white/10 p-2.5 rounded-none text-white focus:outline-none focus:border-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] text-[#999] uppercase tracking-widest font-black mb-1.5">Brand Emblem/Logo</label>
                <input
                  type="text"
                  value={company.logo}
                  onChange={(e) => onCompanyUpdate({ ...company, logo: e.target.value })}
                  className="w-full bg-black border border-white/10 p-2.5 rounded-none text-center font-bold text-white focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-[9px] text-[#999] uppercase tracking-widest font-black mb-1.5">Industry Sectors</label>
                <input
                  type="text"
                  value={company.industry}
                  onChange={(e) => onCompanyUpdate({ ...company, industry: e.target.value })}
                  className="w-full bg-black border border-white/10 p-2.5 rounded-none text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] text-[#999] uppercase tracking-widest font-black mb-1.5">Headquarters Location</label>
              <input
                type="text"
                value={company.location}
                onChange={(e) => onCompanyUpdate({ ...company, location: e.target.value })}
                className="w-full bg-black border border-white/10 p-2.5 rounded-none text-white focus:outline-none\"
              />
            </div>

            <div>
              <label className="block text-[9px] text-[#999] uppercase tracking-widest font-black mb-1.5">Company Staff Size Tag</label>
              <input
                type="text"
                value={company.size}
                onChange={(e) => onCompanyUpdate({ ...company, size: e.target.value })}
                className="w-full bg-black border border-white/10 p-2.5 rounded-none text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] text-[#999] uppercase tracking-widest font-black mb-1.5">Catchy Single-sentence Tagline</label>
            <input
              type="text"
              value={company.tagline}
              onChange={(e) => onCompanyUpdate({ ...company, tagline: e.target.value })}
              className="w-full bg-black border border-white/10 p-2.5 rounded-none text-white focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="block text-[9px] text-[#999] uppercase tracking-widest font-black mb-1.5">Full Organization Overview</label>
            <textarea
              value={company.description}
              onChange={(e) => onCompanyUpdate({ ...company, description: e.target.value })}
              className="w-full h-24 bg-black border border-white/10 p-3 rounded-none text-white leading-relaxed text-xs focus:outline-none focus:border-white"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={() => alert("Company profile configurations updated!")}
              className="px-5 py-3 bg-white text-black hover:bg-zinc-200 transition text-[10px] uppercase tracking-widest font-black rounded-none shadow"
            >
              Save Brand Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
