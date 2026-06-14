import { useState, useMemo, FormEvent } from "react";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Bookmark, 
  BookmarkCheck, 
  ChevronRight, 
  Trash2, 
  Plus, 
  Sparkles, 
  Building, 
  CheckCircle, 
  FolderLock, 
  ExternalLink, 
  Info,
  Clock,
  Filter,
  Layers,
  FileDown
} from "lucide-react";
import { JobPost, SeekerProfile, JobApplication, ApplicationStatus } from "../types";

interface SeekerDashboardProps {
  profile: SeekerProfile;
  jobs: JobPost[];
  savedJobIds: string[];
  applications: JobApplication[];
  onProfileUpdate: (updated: SeekerProfile) => void;
  onToggleSaveJob: (jobId: string) => void;
  onApplyJob: (jobId: string, coverLetter?: string) => void;
  onOpenMatcher: (job: JobPost) => void;
  activeSubSection: "all-jobs" | "my-applications" | "saved-jobs" | "seeker-profile";
}

export function SeekerDashboard({
  profile,
  jobs,
  savedJobIds,
  applications,
  onProfileUpdate,
  onToggleSaveJob,
  onApplyJob,
  onOpenMatcher,
  activeSubSection
}: SeekerDashboardProps) {

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");

  // Detailed view of selected job
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(jobs[0] || null);
  const [coverText, setCoverText] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  // Profile forms state
  const [newSkill, setNewSkill] = useState("");
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  const [companyForm, setCompanyForm] = useState("");
  const [roleForm, setRoleForm] = useState("");
  const [periodForm, setPeriodForm] = useState("");
  const [descForm, setDescForm] = useState("");
  const [isAddingExp, setIsAddingExp] = useState(false);

  const [schoolForm, setSchoolForm] = useState("");
  const [degreeForm, setDegreeForm] = useState("");
  const [yearForm, setYearForm] = useState("");
  const [isAddingEdu, setIsAddingEdu] = useState(false);

  // Search filters options logic
  const uniqueLocations = useMemo(() => {
    const list = jobs.map(j => j.location.split("(")[0].trim());
    return Array.from(new Set(list));
  }, [jobs]);

  const uniqueIndustries = useMemo(() => {
    return Array.from(new Set(jobs.map(j => j.industry)));
  }, [jobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = !locationFilter || job.location.includes(locationFilter);
      const matchesType = !jobTypeFilter || job.jobType === jobTypeFilter;
      const matchesLevel = !levelFilter || job.experienceLevel === levelFilter;
      const matchesIndustry = !industryFilter || job.industry === industryFilter;

      return matchesSearch && matchesLocation && matchesType && matchesLevel && matchesIndustry;
    });
  }, [jobs, searchTerm, locationFilter, jobTypeFilter, levelFilter, industryFilter]);

  const handleApply = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    onApplyJob(selectedJob.id, coverText);
    setCoverText("");
    setIsApplying(false);
  };

  const handleSkillAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (!profile.skills.includes(newSkill.trim())) {
      onProfileUpdate({
        ...profile,
        skills: [...profile.skills, newSkill.trim()]
      });
    }
    setNewSkill("");
    setIsAddingSkill(false);
  };

  const handleSkillRemove = (skill: string) => {
    onProfileUpdate({
      ...profile,
      skills: profile.skills.filter(s => s !== skill)
    });
  };

  const handleAddExperience = (e: FormEvent) => {
    e.preventDefault();
    if (!companyForm || !roleForm) return;
    const item = {
      id: "exp_" + Date.now(),
      company: companyForm,
      role: roleForm,
      period: periodForm,
      description: descForm
    };
    onProfileUpdate({
      ...profile,
      experience: [item, ...profile.experience]
    });
    setCompanyForm("");
    setRoleForm("");
    setPeriodForm("");
    setDescForm("");
    setIsAddingExp(false);
  };

  const handleRemoveExperience = (id: string) => {
    onProfileUpdate({
      ...profile,
      experience: profile.experience.filter(exp => exp.id !== id)
    });
  };

  const handleAddEducation = (e: FormEvent) => {
    e.preventDefault();
    if (!schoolForm || !degreeForm) return;
    const item = {
      id: "edu_" + Date.now(),
      school: schoolForm,
      degree: degreeForm,
      year: yearForm
    };
    onProfileUpdate({
      ...profile,
      education: [item, ...profile.education]
    });
    setSchoolForm("");
    setDegreeForm("");
    setYearForm("");
    setIsAddingEdu(false);
  };

  const handleRemoveEducation = (id: string) => {
    onProfileUpdate({
      ...profile,
      education: profile.education.filter(edu => edu.id !== id)
    });
  };

  return (
    <div id="seeker_panel" className="space-y-6">

      {/* 1. ALL JOBS FINDER VIEW */}
      {activeSubSection === "all-jobs" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Filters Column */}
          <div className="lg:col-span-4 bg-[#111] border border-white/10 rounded-none p-5 space-y-5 h-fit">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-white/10">
              <Filter className="w-3.5 h-3.5 text-blue-500" /> Filter Positions
            </h3>

            {/* Keyword Search */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Keyword Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-zinc-500" />
                <input
                  id="seeker_search_bar"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-none pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-white focus:ring-0 placeholder:text-zinc-650"
                  placeholder="e.g. React, Stripe, Linear..."
                />
              </div>
            </div>

            {/* Location Select */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Location</label>
              <select
                id="filter_location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-none p-2.5 text-xs text-white focus:outline-none focus:border-white focus:ring-0"
              >
                <option value="">All Locations</option>
                {uniqueLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Job Type Select */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Job Type</label>
              <select
                id="filter_job_type"
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-none p-2.5 text-xs text-white focus:outline-none focus:border-white focus:ring-0"
              >
                <option value="">All Types</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Experience Level</label>
              <select
                id="filter_experience"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-none p-2.5 text-xs text-white focus:outline-none focus:border-white focus:ring-0"
              >
                <option value="">All Levels</option>
                <option value="Entry Level">Entry Level</option>
                <option value="Mid Level">Mid Level</option>
                <option value="Senior Level">Senior Level</option>
                <option value="Lead / Manager">Lead / Manager</option>
              </select>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Industry</label>
              <select
                id="filter_industry"
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-none p-2.5 text-xs text-white focus:outline-none focus:border-white focus:ring-0"
              >
                <option value="">All Industries</option>
                {uniqueIndustries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            <button
              id="btn_reset_filters"
              onClick={() => {
                setSearchTerm("");
                setLocationFilter("");
                setJobTypeFilter("");
                setLevelFilter("");
                setIndustryFilter("");
              }}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] uppercase font-black tracking-widest rounded-none transition"
            >
              Reset All Filters
            </button>
          </div>

          {/* Job List & Description Columns */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Vacancies List */}
            <div className="md:col-span-5 space-y-3">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">
                AVAILABLE OPPORTUNITIES ({filteredJobs.length})
              </span>
              
              {filteredJobs.length === 0 ? (
                <div className="bg-[#111] border border-white/10 rounded-none p-6 text-center">
                  <p className="text-zinc-500 text-xs">No active postings match your chosen parameters.</p>
                </div>
              ) : (
                filteredJobs.map(job => {
                  const isSelected = selectedJob?.id === job.id;
                  const isSaved = savedJobIds.includes(job.id);
                  const isApplied = applications.some(app => app.jobId === job.id);

                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`cursor-pointer border p-4 transition-all flex flex-col justify-between h-[140px] rounded-none ${
                        isSelected 
                          ? "bg-[#18181b] border-white shadow-xl shadow-white/5" 
                          : "bg-[#111] border-white/10 hover:border-white/30"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-xl shrink-0 select-none">{job.companyLogo}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#999] whitespace-nowrap">
                            {job.jobType}
                          </span>
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-wide text-white truncate">{job.title}</h4>
                        <p className="text-[11px] text-zinc-400 truncate">{job.companyName}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-zinc-500 font-mono">
                        <span className="truncate max-w-[100px] uppercase">{job.location.split("(")[0]}</span>
                        <span className="text-blue-400 font-bold">{job.salaryRange}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Vacancy Details Card */}
            <div className="md:col-span-7">
              {selectedJob ? (
                <div className="bg-[#111] border border-white/10 rounded-none p-6 space-y-6 sticky top-4 leading-relaxed">
                  
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex gap-3">
                      <span className="text-3xl bg-black p-2.5 rounded-none border border-white/10 shrink-0">
                        {selectedJob.companyLogo}
                      </span>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wide text-white">{selectedJob.title}</h3>
                        <p className="text-zinc-400 text-xs font-mono">{selectedJob.companyName} • {selectedJob.industry}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => onToggleSaveJob(selectedJob.id)}
                      className="p-2 bg-black hover:bg-zinc-900 border border-white/10 rounded-none text-zinc-400 hover:text-white transition"
                    >
                      {savedJobIds.includes(selectedJob.id) ? (
                        <BookmarkCheck className="w-4 h-4 text-white" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Badges strip */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                    <div className="bg-black border border-white/5 px-2.5 py-2.5 rounded-none flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" /> {selectedJob.location}
                    </div>
                    <div className="bg-black border border-white/5 px-2.5 py-2.5 rounded-none flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-blue-500" /> {selectedJob.salaryRange}
                    </div>
                    <div className="bg-black border border-white/5 px-2.5 py-2.5 rounded-none flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-500" /> {selectedJob.jobType}
                    </div>
                    <div className="bg-black border border-white/5 px-2.5 py-2.5 rounded-none flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-500" /> {selectedJob.experienceLevel}
                    </div>
                  </div>

                  {/* AI Quick Match Banner */}
                  <div className="bg-white text-black p-5 rounded-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex gap-2.5 items-start">
                      <Sparkles className="w-5 h-5 text-blue-600 animate-pulse shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wide">COMPATIBILITY INDEX</h4>
                        <p className="text-[10px] text-zinc-700 leading-relaxed mt-0.5">Let Gemini analyze your resume points against requirements.</p>
                      </div>
                    </div>
                    <button
                      id="btn_quick_ai_match"
                      onClick={() => onOpenMatcher(selectedJob)}
                      className="px-3.5 py-2.5 bg-black hover:bg-zinc-900 text-white rounded-none font-black text-[9px] uppercase tracking-widest transition shrink-0"
                    >
                      Analyze Fit
                    </button>
                  </div>

                  {/* Job Overview */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Role Overview</span>
                    <p className="text-xs text-zinc-350 leading-relaxed font-sans">{selectedJob.description}</p>
                  </div>

                  {/* Requirements list */}
                  <div className="space-y-2.5">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Requirements Checklist</span>
                    <ul className="space-y-1.5 list-none pl-0 text-xs text-zinc-355">
                      {selectedJob.requirements.map((req, id) => (
                        <li key={id} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-white font-black shrink-0">—</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA strip */}
                  <div className="border-t border-white/10 pt-4 flex gap-3">
                    {applications.some(app => app.jobId === selectedJob.id) ? (
                      <div className="w-full bg-[#111] border border-white/10 py-3 text-center uppercase tracking-widest flex items-center justify-center gap-2 text-[10px] font-black text-zinc-300">
                        <CheckCircle className="w-4 h-4 text-white" /> Application Lodged
                      </div>
                    ) : isApplying ? (
                      <form onSubmit={handleApply} className="w-full space-y-4 bg-black border border-white/15 p-5 rounded-none">
                        <div>
                          <label className="block text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-2">
                            Add a Cover Letter or Quick Pitch
                          </label>
                          <textarea
                            value={coverText}
                            onChange={(e) => setCoverText(e.target.value)}
                            className="w-full h-28 bg-[#111] border border-white/10 p-3 text-xs text-white focus:outline-none focus:border-white focus:ring-0 rounded-none placeholder:text-zinc-600"
                            placeholder="Write a summary or let Gemini build one in the AI Suite..."
                          />
                        </div>
                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            onClick={() => setIsApplying(false)}
                            className="flex-1 py-2.5 bg-zinc-900 text-zinc-400 text-[10px] uppercase tracking-widest font-black rounded-none hover:bg-zinc-800 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2.5 bg-white text-black text-[10px] uppercase tracking-widest font-black rounded-none hover:bg-zinc-200"
                          >
                            Submit
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        id="btn_apply_trigger"
                        onClick={() => setIsApplying(true)}
                        className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black text-[10px] uppercase tracking-widest font-black rounded-none transition shadow"
                      >
                        Apply with One Tap
                      </button>
                    )}
                  </div>

                </div>
              ) : (
                <div className="bg-[#111] border border-white/10 rounded-none p-10 text-center">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">Select a job post on the left to review descriptions.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* 2. MY APPLICATIONS TRACKING VIEW */}
      {activeSubSection === "my-applications" && (
        <div className="space-y-4">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">
            APPLICATION PIPELINE PROGRESS ({applications.length})
          </span>
          {applications.length === 0 ? (
            <div className="bg-[#111] border border-white/10 rounded-none p-10 text-center">
              <p className="text-zinc-400 text-xs uppercase tracking-wider">You haven't submitted any job applications yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {applications.map(app => {
                const getStatusColor = (status: ApplicationStatus) => {
                  switch (status) {
                    case "Applied": return "bg-zinc-800 text-zinc-350 border-white/10";
                    case "Reviewing": return "bg-indigo-950/20 text-indigo-400 border-indigo-900/30";
                    case "Shortlisted": return "bg-blue-950/20 text-blue-400 border-blue-900/30";
                    case "Interviewing": return "bg-[#111] text-white border-white";
                    case "Offered": return "bg-white text-black border-white";
                    case "Declined": return "bg-zinc-900 text-zinc-500 border-white/5";
                    default: return "bg-zinc-800 text-white border-white/10";
                  }
                };

                return (
                  <div key={app.id} className="bg-[#111] border border-white/10 rounded-none p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    
                    <div className="md:col-span-3 flex gap-3">
                      <span className="text-2xl h-10 w-10 flex items-center justify-center bg-black border border-white/10 rounded-none shrink-0">{app.companyLogo}</span>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">{app.jobTitle}</h4>
                        <p className="text-[11px] text-zinc-400">{app.companyName}</p>
                        <span className="text-[9px] text-zinc-500 block mt-1 font-mono uppercase tracking-wider">Applied: {app.applyDate}</span>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <span className={`px-2.5 py-1 text-[8.5px] uppercase font-black tracking-widest rounded-none border ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="md:col-span-5 text-xs text-zinc-300">
                      {app.fitSummary ? (
                        <div className="bg-[#141414] p-3 rounded-none border border-white/5 space-y-1.5">
                          <span className="text-[8.5px] font-black uppercase text-blue-400 tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Gemini Assessment fit: {app.fitScore}%
                          </span>
                          <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">{app.fitSummary}</p>
                        </div>
                      ) : (
                        <p className="italic text-zinc-500 text-[11px]">Applicant evaluation screening under process.</p>
                      )}
                    </div>

                    <div className="md:col-span-2 self-center flex md:justify-end">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-[#666] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> normal process
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. SAVED JOBS VIEW */}
      {activeSubSection === "saved-jobs" && (
        <div className="space-y-4">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">
            BOOKMARKED OPPORTUNITIES ({savedJobIds.length})
          </span>
          {savedJobIds.length === 0 ? (
            <div className="bg-[#111] border border-white/10 rounded-none p-10 text-center">
              <p className="text-zinc-500 text-xs uppercase tracking-wider">No bookmarked vacancies matches.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.filter(j => savedJobIds.includes(j.id)).map(job => (
                <div key={job.id} className="bg-[#111] border border-white/10 rounded-none p-4.5 flex justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="text-2xl p-2 bg-black rounded-none border border-white/5 h-10 w-10 flex items-center justify-center shrink-0">
                      {job.companyLogo}
                    </span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">{job.title}</h4>
                      <p className="text-[11px] text-zinc-400">{job.companyName}</p>
                      <span className="text-[8.5px] font-black uppercase tracking-widest bg-zinc-800 border border-white/10 text-white px-2 py-0.5 rounded-none mt-1 inline-block font-mono">
                        {job.jobType}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-between items-end shrink-0">
                    <button
                      onClick={() => onToggleSaveJob(job.id)}
                      className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="text-[9px] uppercase tracking-widest text-[#999] hover:text-white flex items-center gap-0.5 font-bold"
                    >
                      View &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. SEEKER PROFILE CONFIGURATION VIEW */}
      {activeSubSection === "seeker-profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 leading-relaxed">
          
          {/* Seeker Info Block Left */}
          <div className="lg:col-span-5 bg-[#111] border border-white/10 rounded-none p-5 space-y-5">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Personal Characteristics</span>
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <img
                src={profile.avatar}
                alt={profile.fullName}
                className="w-16 h-16 rounded-none object-cover border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">{profile.fullName}</h3>
                <input
                  type="text"
                  value={profile.title}
                  onChange={(e) => onProfileUpdate({ ...profile, title: e.target.value })}
                  className="bg-transparent text-xs text-zinc-400 w-full focus:outline-none focus:border-white border-b border-transparent pb-0.5 mt-1 font-mono"
                />
                <span className="text-[8px] tracking-widest uppercase text-blue-500 font-mono mt-1 block">Verified Account</span>
              </div>
            </div>

            {/* Email Contact info */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold uppercase tracking-wider text-[9px] mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full bg-black border border-white/5 text-zinc-500 rounded-none p-2.5 focus:none text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold uppercase tracking-wider text-[9px] mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => onProfileUpdate({ ...profile, phone: e.target.value })}
                  className="w-full bg-black border border-white/10 text-white rounded-none p-2.5 focus:outline-none focus:border-white focus:ring-0 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold uppercase tracking-wider text-[9px] mb-1.5">Professional Bio Summary</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => onProfileUpdate({ ...profile, bio: e.target.value })}
                  className="w-full h-24 bg-black border border-white/10 text-white p-3 text-xs focus:outline-none focus:border-white focus:ring-0 rounded-none font-sans leading-relaxed"
                />
              </div>
            </div>

            {/* Skills Segment */}
            <div className="space-y-2 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Core Skills / Tags</span>
                <button
                  type="button"
                  onClick={() => setIsAddingSkill(!isAddingSkill)}
                  className="px-2 py-1 bg-zinc-800 border border-white/10 hover:bg-zinc-700 text-white rounded-none transition text-[9px] uppercase tracking-widest flex items-center gap-1 font-black"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {isAddingSkill && (
                <form onSubmit={handleSkillAdd} className="flex gap-2 bg-black border border-white/15 p-2 rounded-none">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-white focus:outline-none pr-2 rounded-none font-mono"
                    placeholder="e.g. AWS, Node, Figma"
                    autoFocus
                  />
                  <button type="submit" className="px-2.5 py-1 bg-white text-black text-[9px] uppercase tracking-widest font-black rounded-none">
                    Save
                  </button>
                </form>
              )}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.skills.map(sk => (
                  <span
                    key={sk}
                    className="bg-[#141414] border border-white/5 text-xs text-zinc-300 px-2 py-1 rounded-none flex items-center gap-1 font-mono uppercase text-[9px] tracking-wide"
                  >
                    {sk}
                    <button
                      type="button"
                      onClick={() => handleSkillRemove(sk)}
                      className="hover:text-white text-zinc-500 ml-1 font-bold text-xs"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Resume Plain Text Container */}
            <div className="space-y-2.5 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Plain Text Resume</span>
                <span className="text-[8.5px] bg-zinc-900 text-zinc-300 px-2.5 py-1 border border-white/10 rounded-none flex items-center gap-1 font-black uppercase tracking-widest font-mono">
                  <FileDown className="w-3 h-3 text-white" /> {profile.resumeFileName}
                </span>
              </div>
              <textarea
                value={profile.resumeText}
                onChange={(e) => onProfileUpdate({ ...profile, resumeText: e.target.value })}
                className="w-full h-48 bg-black border border-white/10 text-zinc-300 p-3 text-[10px] leading-relaxed font-mono rounded-none focus:border-white focus:outline-none focus:ring-0"
              />
            </div>

          </div>

          {/* Education & Experience Right */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Work experience blocks */}
            <div className="bg-[#111] border border-white/10 rounded-none p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Work Experience History</span>
                <button
                  onClick={() => setIsAddingExp(!isAddingExp)}
                  className="px-2.5 py-1.5 bg-white text-black hover:bg-zinc-200 transition text-[9px] uppercase tracking-widest flex items-center gap-1 font-black rounded-none"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Experience
                </button>
              </div>

              {isAddingExp && (
                <form onSubmit={handleAddExperience} className="bg-black border border-white/15 p-5 rounded-none space-y-4 leading-none">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-[#999] font-semibold mb-1.5">Company *</label>
                      <input
                        type="text"
                        value={companyForm}
                        onChange={(e) => setCompanyForm(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 p-2.5 text-xs rounded-none text-white focus:outline-none focus:border-white"
                        placeholder="Orbit Tech"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-[#999] font-semibold mb-1.5">Role/Title *</label>
                      <input
                        type="text"
                        value={roleForm}
                        onChange={(e) => setRoleForm(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 p-2.5 text-xs rounded-none text-white focus:outline-none focus:border-white"
                        placeholder="Frontend Dev"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-[#999] font-semibold mb-1.5">Period / Range</label>
                    <input
                      type="text"
                      value={periodForm}
                      onChange={(e) => setPeriodForm(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 p-2.5 text-xs rounded-none text-white focus:outline-none focus:border-white"
                      placeholder="e.g. 2024 - 2026, or Present"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-[#999] font-semibold mb-1.5">Major Accomplishments (Markdown ok)</label>
                    <textarea
                      value={descForm}
                      onChange={(e) => setDescForm(e.target.value)}
                      className="w-full h-24 bg-[#111] border border-white/10 p-2.5 text-xs rounded-none text-white focus:outline-none focus:border-white"
                      placeholder="Owned key component modules, optimized indexers and dashboards..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingExp(false)}
                      className="px-3.5 py-2.5 bg-zinc-800 text-white text-[9px] uppercase tracking-widest font-black rounded-none hover:bg-zinc-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!companyForm || !roleForm}
                      className="px-3.5 py-2.5 bg-white text-black text-[9px] uppercase tracking-widest font-black rounded-none hover:bg-zinc-200"
                    >
                      Save Block
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {profile.experience.map(exp => (
                  <div key={exp.id} className="bg-[#141414] border border-white/5 rounded-none p-4.5 space-y-2 relative group">
                    <button
                      onClick={() => handleRemoveExperience(exp.id)}
                      className="absolute right-3 top-3 p-1.5 hover:bg-black rounded text-zinc-500 hover:text-white transition"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">{exp.role}</h4>
                      <p className="text-[11px] text-zinc-400 font-medium">{exp.company} • <span className="font-mono text-[9px] text-zinc-500">{exp.period}</span></p>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Education section */}
            <div className="bg-[#111] border border-white/10 rounded-none p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Education Alignment</span>
                <button
                  onClick={() => setIsAddingEdu(!isAddingEdu)}
                  className="px-2.5 py-1.5 bg-white text-black hover:bg-zinc-200 transition text-[9px] uppercase tracking-widest flex items-center gap-1 font-black rounded-none"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Education
                </button>
              </div>

              {isAddingEdu && (
                <form onSubmit={handleAddEducation} className="bg-black border border-white/15 p-5 rounded-none space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-[#999] font-semibold mb-1.5">School / Institute *</label>
                      <input
                        type="text"
                        value={schoolForm}
                        onChange={(e) => setSchoolForm(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 p-2.5 text-xs rounded-none text-white focus:outline-none focus:border-white"
                        placeholder="E.g. Western State College"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-[#999] font-semibold mb-1.5">Degree / Course *</label>
                      <input
                        type="text"
                        value={degreeForm}
                        onChange={(e) => setDegreeForm(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 p-2.5 text-xs rounded-none text-white focus:outline-none focus:border-white"
                        placeholder="E.g. B.S. in Computer Science"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-[#999] font-semibold mb-1.5">Graduation Year</label>
                    <input
                      type="text"
                      value={yearForm}
                      onChange={(e) => setYearForm(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 p-2.5 text-xs rounded-none text-white focus:outline-none focus:border-white"
                      placeholder="e.g. 2018 - 2022"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingEdu(false)}
                      className="px-3.5 py-2.5 bg-zinc-800 text-white text-[9px] uppercase tracking-widest font-black rounded-none hover:bg-zinc-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!schoolForm || !degreeForm}
                      className="px-3.5 py-2.5 bg-white text-black text-[9px] uppercase tracking-widest font-black rounded-none hover:bg-zinc-200"
                    >
                      Save Degree
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {profile.education.map(edu => (
                  <div key={edu.id} className="bg-[#141414] border border-white/5 rounded-none p-4.5 relative group flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">{edu.degree}</h4>
                      <p className="text-[11px] text-zinc-400 font-medium">{edu.school} • <span className="font-mono text-[9px] text-zinc-500">{edu.year}</span></p>
                    </div>
                    <button
                      onClick={() => handleRemoveEducation(edu.id)}
                      className="p-1.5 hover:bg-black rounded text-zinc-500 hover:text-white transition"
                      title="Delete degree"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
