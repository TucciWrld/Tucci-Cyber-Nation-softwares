export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  year: string;
}

export interface SeekerProfile {
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
  title: string;
  bio: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  portfolioLinks: string[];
  resumeText: string;
  resumeFileName: string;
}

export interface CompanyProfile {
  name: string;
  logo: string;
  tagline: string;
  description: string;
  rating: number;
  industry: string;
  size: string;
  website: string;
  location: string;
}

export type JobType = "Full-time" | "Part-time" | "Remote" | "Hybrid" | "Internship" | "Freelance";
export type ExperienceLevel = "Entry Level" | "Mid Level" | "Senior Level" | "Lead / Manager";

export interface JobPost {
  id: string;
  title: string;
  companyName: string;
  companyLogo: string;
  location: string;
  salaryRange: string;
  jobType: JobType;
  industry: string;
  experienceLevel: ExperienceLevel;
  description: string;
  requirements: string[];
  benefits: string[];
  postedAt: string;
  employerId: string;
  viewsCount: number;
  appCount: number;
}

export type ApplicationStatus = "Applied" | "Reviewing" | "Shortlisted" | "Interviewing" | "Offered" | "Declined";

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  seekerId: string;
  seekerName: string;
  seekerEmail: string;
  applyDate: string;
  status: ApplicationStatus;
  coverLetter?: string;
  fitScore?: number;
  fitSummary?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderType: "seeker" | "recruiter";
  senderName: string;
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  seekerId: string;
  seekerName: string;
  recruiterId: string;
  lastMessage?: string;
  lastUpdated: string;
}

export interface UserNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: "job" | "application" | "message";
}

export interface AppState {
  currentTab: "all-jobs" | "my-applications" | "saved-jobs" | "seeker-profile" | "career-coach" | "recruiter-dashboard" | "recruiter-profile";
  userType: "seeker" | "recruiter";
  seekerProfile: SeekerProfile;
  companyProfile: CompanyProfile;
  jobs: JobPost[];
  applications: JobApplication[];
  chats: ChatSession[];
  messages: { [chatId: string]: ChatMessage[] };
  savedJobIds: string[];
  notifications: UserNotification[];
}
