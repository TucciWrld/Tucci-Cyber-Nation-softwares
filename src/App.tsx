import { useState, useEffect } from "react";
import { 
  Briefcase, 
  Sparkles, 
  CheckCircle, 
  Bookmark, 
  User, 
  MessageSquare, 
  Building, 
  Activity, 
  Bell, 
  ChevronRight, 
  LogOut, 
  Plus, 
  FileText,
  Info,
  HelpCircle,
  HelpCircle as QuestionIcon
} from "lucide-react";
import { 
  AppState, 
  SeekerProfile, 
  CompanyProfile, 
  JobPost, 
  JobApplication, 
  ChatSession, 
  ChatMessage, 
  UserNotification,
  ApplicationStatus
} from "./types";
import { INITIAL_SEEKER_PROFILE, INITIAL_COMPANY_PROFILE, INITIAL_JOBS, INITIAL_APPLICATIONS } from "./data";
import { SeekerDashboard } from "./components/SeekerDashboard";
import { RecruiterDashboard } from "./components/RecruiterDashboard";
import { AIPortals } from "./components/AIPortals";
import { ActiveChat } from "./components/ActiveChat";

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc, 
  increment 
} from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db, logInWithGoogle, logOut, handleFirestoreError, OperationType } from "./firebase";

// Seeding helper to pre-populate database collections if they are empty
async function seedFirestoreIfEmpty() {
  try {
    const { getDocs, limit: firestoreLimit, query: firestoreQuery, collection: firestoreCollection } = await import("firebase/firestore");
    const snapshot = await getDocs(firestoreQuery(firestoreCollection(db, "jobs"), firestoreLimit(1)));
    if (snapshot.empty) {
      console.log("[Firebase Seeding] Database is empty. Seeding INITIAL_JOBS and INITIAL_APPLICATIONS...");
      for (const job of INITIAL_JOBS) {
        await setDoc(doc(db, "jobs", job.id), job);
      }
      for (const app of INITIAL_APPLICATIONS) {
        await setDoc(doc(db, "applications", app.id), app);
      }
      console.log("[Firebase Seeding] Successfully pre-populated Firestore collections.");
    }
  } catch (err) {
    console.warn("Seeding empty check bypassed:", err);
  }
}

export default function App() {
  // Session User State
  const [sessionUser, setSessionUser] = useState<FirebaseUser | null>(null);

  // Global React States initialized with Local Storage Fallbacks
  const [userType, setUserType] = useState<"seeker" | "recruiter">(() => {
    const saved = localStorage.getItem("hj_user_type");
    return (saved as "seeker" | "recruiter") || "seeker";
  });

  const [seekerProfile, setSeekerProfile] = useState<SeekerProfile>(() => {
    const saved = localStorage.getItem("hj_seeker_profile");
    return saved ? JSON.parse(saved) : INITIAL_SEEKER_PROFILE;
  });

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem("hj_company_profile");
    return saved ? JSON.parse(saved) : INITIAL_COMPANY_PROFILE;
  });

  const [jobs, setJobs] = useState<JobPost[]>(() => {
    const saved = localStorage.getItem("hj_jobs");
    return saved ? JSON.parse(saved) : INITIAL_JOBS;
  });

  const [applications, setApplications] = useState<JobApplication[]>(() => {
    const saved = localStorage.getItem("hj_applications");
    return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
  });

  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("hj_saved_job_ids");
    return saved ? JSON.parse(saved) : ["job1", "job3"];
  });

  // Current Seeker View state
  const [seekerTab, setSeekerTab] = useState<"all-jobs" | "my-applications" | "saved-jobs" | "seeker-profile" | "career-coach">("all-jobs");
  
  // Current Recruiter View state
  const [recruiterTab, setRecruiterTab] = useState<"dashboard" | "company-profile" | "post-vacancy">("dashboard");

  // Notifications
  const [notifications, setNotifications] = useState<UserNotification[]>(() => {
    const saved = localStorage.getItem("hj_notifications");
    return saved ? JSON.parse(saved) : [
      {
        id: "notif_1",
        title: "Match Analysis Completed",
        description: "Your match compatibility index for 'Senior React Engineer' is ready inside the AI Suite.",
        timestamp: "5 mins ago",
        read: false,
        type: "job"
      },
      {
        id: "notif_2",
        title: "Profile Shortlisted!",
        description: "NextGen Labs reviewed and shortlisted your application for 'Senior React Engineer'. Check notes!",
        timestamp: "2 hours ago",
        read: true,
        type: "application"
      }
    ];
  });
  
  const [showNotifications, setShowNotifications] = useState(false);

  // Chat/Messaging structures
  const [chats, setChats] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem("hj_chats");
    return saved ? JSON.parse(saved) : [
      {
        id: "chat_1",
        jobId: "job1",
        jobTitle: "Senior React Engineer",
        companyName: "NextGen Labs",
        seekerId: "seeker_init",
        seekerName: "Emma Davis",
        recruiterId: "recruiter1",
        lastMessage: "Shall we hop on video tomorrow for a technical sync?",
        lastUpdated: "Yesterday"
      }
    ];
  });

  const [messages, setMessages] = useState<{ [chatId: string]: ChatMessage[] }>(() => {
    const saved = localStorage.getItem("hj_messages");
    return saved ? JSON.parse(saved) : {
      chat_1: [
        {
          id: "m1",
          chatId: "chat_1",
          senderId: "seeker_init",
          senderType: "seeker",
          senderName: "Emma Davis",
          text: "Hi NextGen Hiring Group, I am excited to connect! Here is my portfolio link.",
          timestamp: "Yesterday, 3:30 PM"
        },
        {
          id: "m2",
          chatId: "chat_1",
          senderId: "recruiter1",
          senderType: "recruiter",
          senderName: "Recruiter Ava",
          text: "Hi Emma! Your frontend react adjustments layout is exceptionally polished. Shall we hop on video tomorrow for a technical sync?",
          timestamp: "Yesterday, 4:15 PM"
        }
      ]
    };
  });

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);

  // Cross sync triggers
  const [selectedJobForMatcher, setSelectedJobForMatcher] = useState<JobPost | undefined>(undefined);

  // Seeker Update Local wrapper
  const handleUpdateSeekerLocal = async (updated: SeekerProfile) => {
    setSeekerProfile(updated);
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, "users", auth.currentUser.uid), updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `/users/${auth.currentUser.uid}`);
      }
    }
  };

  // Company Update Local wrapper
  const handleUpdateCompanyLocal = async (updated: CompanyProfile) => {
    setCompanyProfile(updated);
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, "companies", auth.currentUser.uid), updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `/companies/${auth.currentUser.uid}`);
      }
    }
  };

  // ----------------------------------------------------
  // FIREBASE REAL-TIME SYNC ENGINE
  // ----------------------------------------------------
  useEffect(() => {
    seedFirestoreIfEmpty();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setSessionUser(u);

        // 1. Fetch/Create Seeker profile
        try {
          const userDocRef = doc(db, "users", u.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setSeekerProfile(userDoc.data() as SeekerProfile);
          } else {
            const initialProf: SeekerProfile = {
              ...INITIAL_SEEKER_PROFILE,
              fullName: u.displayName || INITIAL_SEEKER_PROFILE.fullName,
              email: u.email || INITIAL_SEEKER_PROFILE.email,
              avatar: u.photoURL || INITIAL_SEEKER_PROFILE.avatar
            };
            await setDoc(userDocRef, initialProf);
            setSeekerProfile(initialProf);
          }

          // 2. Fetch/Create Company profile
          const compDocRef = doc(db, "companies", u.uid);
          const compDoc = await getDoc(compDocRef);
          if (compDoc.exists()) {
            setCompanyProfile(compDoc.data() as CompanyProfile);
          } else {
            const initialComp: CompanyProfile = {
              ...INITIAL_COMPANY_PROFILE,
              name: u.displayName ? `${u.displayName}'s Enterprise` : INITIAL_COMPANY_PROFILE.name
            };
            await setDoc(compDocRef, initialComp);
            setCompanyProfile(initialComp);
          }
        } catch (err) {
          console.error("Error setting up user accounts in Firestore:", err);
        }

        // 3. Keep Collections synchronized in real-time
        const unsubJobs = onSnapshot(collection(db, "jobs"), snap => {
          const activeJobs: JobPost[] = [];
          snap.forEach(d => {
            const data = d.data();
            activeJobs.push({ ...data, id: d.id } as JobPost);
          });
          if (activeJobs.length > 0) {
            setJobs(activeJobs);
          }
        }, err => console.warn("Jobs snap listener error:", err));

        const unsubApps = onSnapshot(collection(db, "applications"), snap => {
          const activeApps: JobApplication[] = [];
          snap.forEach(d => {
            const data = d.data();
            activeApps.push({ ...data, id: d.id } as JobApplication);
          });
          if (activeApps.length > 0) {
            setApplications(activeApps);
          }
        }, err => console.warn("Apps snap listener error:", err));

        const unsubChats = onSnapshot(collection(db, "chats"), snap => {
          const activeChats: ChatSession[] = [];
          snap.forEach(d => {
            const data = d.data();
            activeChats.push({ ...data, id: d.id } as ChatSession);
          });
          if (activeChats.length > 0) {
            setChats(activeChats);
          }
        }, err => console.warn("Chats snap listener error:", err));

        const unsubNotifs = onSnapshot(collection(db, "users", u.uid, "notifications"), snap => {
          const activeNotifs: UserNotification[] = [];
          snap.forEach(d => {
            const data = d.data();
            activeNotifs.push({ ...data, id: d.id } as UserNotification);
          });
          setNotifications(activeNotifs);
        }, err => console.warn("Notifications snap listener error:", err));

        return () => {
          unsubJobs();
          unsubApps();
          unsubChats();
          unsubNotifs();
        };

      } else {
        setSessionUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync active chat messages in real-time
  useEffect(() => {
    if (!auth.currentUser || !selectedChatId) return;

    const unsubMessages = onSnapshot(collection(db, "chats", selectedChatId, "messages"), snap => {
      const msgsList: ChatMessage[] = [];
      snap.forEach(d => msgsList.push({ ...d.data(), id: d.id } as ChatMessage));
      setMessages(prev => ({
        ...prev,
        [selectedChatId]: msgsList.sort((a, b) => a.id.localeCompare(b.id))
      }));
    }, err => console.warn("Messages snap listener error:", err));

    return () => unsubMessages();
  }, [selectedChatId]);


  // Save changes locally when not signed into Firebase Auth
  useEffect(() => {
    localStorage.setItem("hj_user_type", userType);
    localStorage.setItem("hj_seeker_profile", JSON.stringify(seekerProfile));
    localStorage.setItem("hj_company_profile", JSON.stringify(companyProfile));
    localStorage.setItem("hj_jobs", JSON.stringify(jobs));
    localStorage.setItem("hj_applications", JSON.stringify(applications));
    localStorage.setItem("hj_saved_job_ids", JSON.stringify(savedJobIds));
    localStorage.setItem("hj_notifications", JSON.stringify(notifications));
    localStorage.setItem("hj_chats", JSON.stringify(chats));
    localStorage.setItem("hj_messages", JSON.stringify(messages));
  }, [userType, seekerProfile, companyProfile, jobs, applications, savedJobIds, notifications, chats, messages]);

  const handleApplyJob = async (jobId: string, coverLetter?: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const appId = "app_" + Date.now();
    const currUid = auth.currentUser?.uid || "seeker_init";
    const newApp: JobApplication = {
      id: appId,
      jobId,
      jobTitle: job.title,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      seekerId: currUid,
      seekerName: seekerProfile.fullName,
      seekerEmail: seekerProfile.email,
      applyDate: new Date().toISOString().split("T")[0],
      status: "Applied",
      coverLetter: coverLetter || `Hi, I am interested in applying for your ${job.title} job posting.`
    };

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, "applications", appId), newApp);
        await updateDoc(doc(db, "jobs", jobId), {
          appCount: increment(1)
        });

        // Add Seeker Notification
        const sNotifId = "notif_" + Date.now();
        await setDoc(doc(db, "users", currUid, "notifications", sNotifId), {
          title: "Application Submitted",
          description: `You successfully applied to "${job.title}" at ${job.companyName}.`,
          timestamp: "Just now",
          read: false,
          type: "application"
        });

        // Add Recruiter Notification
        const rNotifId = "notif_rec_" + Date.now();
        await setDoc(doc(db, "users", job.employerId, "notifications", rNotifId), {
          title: "New Incoming Applicant",
          description: `${seekerProfile.fullName} applied to your ${job.title} job. Screen them today!`,
          timestamp: "Just now",
          read: false,
          type: "application"
        });

        // Create Chat Conversation Session
        const chatExists = chats.find(c => c.jobId === jobId && c.seekerId === currUid);
        if (!chatExists) {
          const newChatId = "chat_" + Date.now();
          const newChat: ChatSession = {
            id: newChatId,
            jobId,
            jobTitle: job.title,
            companyName: job.companyName,
            seekerId: currUid,
            seekerName: seekerProfile.fullName,
            recruiterId: job.employerId,
            lastMessage: "Application submitted. Initiate professional communication logs.",
            lastUpdated: "Just now"
          };
          await setDoc(doc(db, "chats", newChatId), newChat);

          const msgId = "msg_init_" + Date.now();
          await setDoc(doc(db, "chats", newChatId, "messages", msgId), {
            chatId: newChatId,
            senderId: currUid,
            senderType: "seeker",
            senderName: seekerProfile.fullName,
            text: `Applied to role. Pitch draft: "${coverLetter || "Highly interested in contributing dynamic assets to your build."}"`,
            timestamp: "Just now"
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `/applications/${appId}`);
      }
    } else {
      setApplications(prev => [newApp, ...prev]);

      const newNotif: UserNotification = {
        id: "notif_" + Date.now(),
        title: "Application Submitted",
        description: `You successfully applied to "${job.title}" at ${job.companyName}.`,
        timestamp: "Just now",
        read: false,
        type: "application"
      };
      setNotifications(prev => [newNotif, ...prev]);

      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, appCount: j.appCount + 1 } : j));

      const recNotif: UserNotification = {
        id: "notif_rec_" + Date.now(),
        title: "New Incoming Applicant",
        description: `${seekerProfile.fullName} applied to your Senior React Engineer job. Screen them today!`,
        timestamp: "Just now",
        read: false,
        type: "application"
      };
      setNotifications(prev => [recNotif, ...prev]);

      const chatExists = chats.find(c => c.jobId === jobId && c.seekerId === "seeker_init");
      if (!chatExists) {
        const newChatId = "chat_" + Date.now();
        const newChat: ChatSession = {
          id: newChatId,
          jobId,
          jobTitle: job.title,
          companyName: job.companyName,
          seekerId: "seeker_init",
          seekerName: seekerProfile.fullName,
          recruiterId: "recruiter1",
          lastMessage: "Application submitted. Initiate professional communication logs.",
          lastUpdated: "Just now"
        };
        setChats(prev => [newChat, ...prev]);
        setMessages(prev => ({
          ...prev,
          [newChatId]: [
            {
              id: "msg_init_" + Date.now(),
              chatId: newChatId,
              senderId: "seeker_init",
              senderType: "seeker",
              senderName: seekerProfile.fullName,
              text: `Applied to role. Pitch draft: "${coverLetter || "Highly interested in contributing dynamic assets to your build."}"`,
              timestamp: "Just now"
            }
          ]
        }));
      }
    }
  };

  const handleToggleSaveJob = (jobId: string) => {
    setSavedJobIds(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const handlePostJob = async (newJobData: Omit<JobPost, "id" | "postedAt" | "viewsCount" | "appCount">) => {
    const jobId = "job_" + Date.now();
    const currUid = auth.currentUser?.uid || "recruiter1";
    const freshJob: JobPost = {
      ...newJobData,
      id: jobId,
      postedAt: new Date().toISOString().split("T")[0],
      viewsCount: 1,
      appCount: 0,
      employerId: currUid
    };

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, "jobs", jobId), freshJob);

        const notifId = "notif_job_" + Date.now();
        await setDoc(doc(db, "users", "seeker_init", "notifications", notifId), {
          title: "New Matching Post Alert",
          description: `New position posted matching your industry: "${freshJob.title}" at ${freshJob.companyName}.`,
          timestamp: "Just now",
          read: false,
          type: "job"
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `/jobs/${jobId}`);
      }
    } else {
      setJobs(prev => [freshJob, ...prev]);

      const checkNotif: UserNotification = {
        id: "notif_job_" + Date.now(),
        title: "New Matching Post Alert",
        description: `New position posted matching your industry: "${freshJob.title}" at ${freshJob.companyName}.`,
        timestamp: "Just now",
        read: false,
        type: "job"
      };
      setNotifications(prev => [checkNotif, ...prev]);
    }
  };

  const handleUpdateApplicationStatus = async (appId: string, status: ApplicationStatus, score?: number, summary?: string) => {
    const updatedFields: any = { status };
    if (score !== undefined) updatedFields.fitScore = score;
    if (summary !== undefined) updatedFields.fitSummary = summary;

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, "applications", appId), updatedFields);

        const app = applications.find(a => a.id === appId);
        if (app) {
          const alertNotifId = "notif_upd_" + Date.now();
          await setDoc(doc(db, "users", app.seekerId, "notifications", alertNotifId), {
            title: `Status Updated: ${status}`,
            description: `${app.companyName} marked your application for "${app.jobTitle}" as: ${status}.`,
            timestamp: "Just now",
            read: false,
            type: "application"
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `/applications/${appId}`);
      }
    } else {
      setApplications(prev => prev.map(app => 
        app.id === appId 
          ? {
              ...app,
              status,
              ...(score !== undefined ? { fitScore: score } : {}),
              ...(summary !== undefined ? { fitSummary: summary } : {})
            }
          : app
      ));

      const app = applications.find(a => a.id === appId);
      if (app) {
        const alertNotif: UserNotification = {
          id: "notif_upd_" + Date.now(),
          title: `Status Updated: ${status}`,
          description: `${app.companyName} marked your application for "${app.jobTitle}" as: ${status}.`,
          timestamp: "Just now",
          read: false,
          type: "application"
        };
        setNotifications(prev => [alertNotif, ...prev]);
      }
    }
  };

  const handleStartChatFromRecruiter = async (seekerId: string, seekerName: string, jobId: string, jobTitle: string) => {
    let chat = chats.find(c => c.jobId === jobId && c.seekerId === seekerId);
    let cid = chat?.id;

    if (!chat) {
      cid = "chat_" + Date.now();
      const newChat: ChatSession = {
        id: cid,
        jobId,
        jobTitle,
        companyName: companyProfile.name,
        seekerId,
        seekerName,
        recruiterId: auth.currentUser?.uid || "recruiter1",
        lastMessage: "Hiring Group initiated professional contact logs.",
        lastUpdated: "Just now"
      };

      if (auth.currentUser) {
        try {
          await setDoc(doc(db, "chats", cid), newChat);

          const msgId = "m_first_" + Date.now();
          await setDoc(doc(db, "chats", cid, "messages", msgId), {
            chatId: cid,
            senderId: auth.currentUser.uid,
            senderType: "recruiter",
            senderName: "Hiring Team",
            text: "Hello candidate! We reviewed your portfolio. Let's arrange a standard technical screening review session.",
            timestamp: "Just now"
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `/chats/${cid}`);
        }
      } else {
        setChats(prev => [newChat, ...prev]);
        setMessages(prev => ({
          ...prev,
          [cid]: [
            {
              id: "m_first_" + Date.now(),
              chatId: cid,
              senderId: "recruiter1",
              senderType: "recruiter",
              senderName: "Hiring Team",
              text: "Hello candidate! We reviewed your portfolio. Let's arrange a standard technical screening review session.",
              timestamp: "Just now"
            }
          ]
        }));
      }
    }

    setSelectedChatId(cid);
    setIsChatPanelOpen(true);
  };

  const handleSendMessage = async (chatId: string, text: string) => {
    const isSeeker = userType === "seeker";
    const senderId = isSeeker ? (auth.currentUser?.uid || "seeker_init") : (auth.currentUser?.uid || "recruiter1");
    const senderName = isSeeker ? seekerProfile.fullName : "Hiring Team";
    const msgId = "msg_" + Date.now();
    const newMsg: ChatMessage = {
      id: msgId,
      chatId,
      senderId,
      senderType: isSeeker ? "seeker" : "recruiter",
      senderName,
      text,
      timestamp: "Just now"
    };

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, "chats", chatId, "messages", msgId), newMsg);
        await updateDoc(doc(db, "chats", chatId), {
          lastMessage: text,
          lastUpdated: "Just now"
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `/chats/${chatId}/messages/${msgId}`);
      }
    } else {
      setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), newMsg]
      }));
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, lastMessage: text, lastUpdated: "Just now" } : c));
    }
  };

  const handleOpenMatcherAndRedirect = (job: JobPost) => {
    setSelectedJobForMatcher(job);
    setSeekerTab("career-coach");
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const activeChatSession = chats.find(c => c.id === selectedChatId);

  return (
    <div id="hyper_jobs_root" className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-blue-600/30 border-8 border-[#111]">
      
      {/* Dynamic Header */}
      <header className="bg-[#0a0a0a] border-b border-white/10 px-6 py-5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-4">
            <span className="text-xl bg-white text-black px-3.5 py-1 text-center select-none font-black tracking-tighter uppercase font-mono border-2 border-white">
              H
            </span>
            <div>
              <h1 id="app_brand_title" className="text-xl font-black tracking-tighter text-white uppercase flex items-center gap-2 font-sans">
                HYPER JOBS <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 bg-white/10 text-blue-400 rounded-full border border-white/10 font-sans">AI MATCHING</span>
              </h1>
              <p className="text-[10px] text-zinc-400 tracking-wider uppercase font-semibold hidden sm:block">A modern recruitment platform powered by Gemini server-side intelligence</p>
            </div>
          </div>

          {/* Account selector and Actions */}
          <div className="flex items-center gap-3">
            
            {/* Google Authentication Control */}
            {sessionUser ? (
              <div className="flex items-center gap-3">
                <img 
                  src={sessionUser.photoURL || seekerProfile.avatar} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full border border-white/20 object-cover"
                />
                <button
                  id="btn_auth_logout"
                  onClick={logOut}
                  className="px-3 py-1.5 bg-[#121212] hover:bg-red-950/40 hover:text-red-400 border border-white/10 rounded text-zinc-300 hover:border-red-500/50 transition text-[10px] tracking-widest font-bold uppercase flex items-center gap-1"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                id="btn_auth_login"
                onClick={logInWithGoogle}
                className="px-4 py-2 bg-white text-black hover:bg-zinc-200 transition text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md rounded-none border border-white"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                Sign In
              </button>
            )}

            {/* Account Type Selector Toggle */}
            <div className="flex bg-[#111] p-1 rounded border border-white/10 font-sans text-xs">
              <button
                id="btn_mode_seeker"
                onClick={() => {
                  setUserType("seeker");
                }}
                className={`px-4 py-1.5 rounded transition-all uppercase tracking-widest text-[9px] font-bold flex items-center gap-1.5 ${
                  userType === "seeker"
                    ? "bg-white text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <User className="w-3 h-3" /> Seeker Mode
              </button>
              <button
                id="btn_mode_recruiter"
                onClick={() => {
                  setUserType("recruiter");
                }}
                className={`px-4 py-1.5 rounded transition-all uppercase tracking-widest text-[9px] font-bold flex items-center gap-1.5 ${
                  userType === "recruiter"
                    ? "bg-white text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Building className="w-3 h-3" /> Recruiter Mode
              </button>
            </div>

            {/* Notification Center */}
            <div className="relative">
              <button
                id="btn_notifications_center"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 bg-[#111] hover:bg-zinc-800 border border-white/10 rounded text-zinc-400 hover:text-white transition relative"
              >
                <Bell className="w-4 h-4" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-blue-550 rounded-full animate-bounce" />
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3.5 w-80 bg-[#0f0f12] border border-white/10 rounded shadow-2xl p-4 space-y-3 z-50 animate-fade-in leading-relaxed text-xs">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-bold text-white text-xs uppercase tracking-wider">Alerts ({notifications.filter(n => !n.read).length})</span>
                    <div className="flex gap-2">
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[9px] text-blue-400 hover:text-white font-bold uppercase tracking-wider"
                      >
                        Read all
                      </button>
                      <span className="text-zinc-700 font-mono">|</span>
                      <button
                        onClick={clearNotifications}
                        className="text-[9px] text-zinc-500 hover:text-rose-400 font-bold uppercase tracking-wider"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-zinc-500 text-[10px] uppercase font-medium tracking-wider text-center py-6">All clear. No notifications.</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-3 rounded border text-[11px] ${
                            n.read 
                              ? "bg-transparent border-transparent" 
                              : "bg-[#18181b] border-white/10"
                          }`}
                        >
                          <h4 className="font-bold text-white flex items-center gap-1 mb-1 text-[11px] uppercase tracking-wide">
                            {n.type === "application" ? "📋 " : n.type === "message" ? "💬 " : "⚡ "}
                            {n.title}
                          </h4>
                          <p className="text-zinc-400 leading-relaxed">{n.description}</p>
                          <span className="text-[8px] text-zinc-600 block text-right mt-1.5 font-mono">{n.timestamp}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* In-app Direct Messages logs panel slide */}
            <button
              id="btn_chat_trigger"
              onClick={() => setIsChatPanelOpen(!isChatPanelOpen)}
              className="p-2.5 bg-[#111] hover:bg-zinc-800 border border-white/10 rounded text-zinc-400 hover:text-white transition flex items-center justify-center relative"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-blue-600 text-[8px] font-extrabold h-4.5 w-4.5 rounded-full flex items-center justify-center font-mono text-white border border-[#050505]">
                {chats.length}
              </span>
            </button>

          </div>

        </div>
      </header>

      {/* Primary Workspace container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-6 leading-relaxed">
        
        {/* Navigation Sidebar/Control panel - 3 columns */}
        <div className="md:col-span-3 space-y-4">
          
          {/* Active profile branding card */}
          <div className="bg-[#111] border border-white/10 rounded-none p-5 space-y-4">
            {userType === "seeker" ? (
              <div className="flex items-center gap-3">
                <img
                  src={seekerProfile.avatar}
                  alt={seekerProfile.fullName}
                  className="w-12 h-12 rounded-none object-cover border border-white/10"
                />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">{seekerProfile.fullName}</h3>
                  <p className="text-[10px] text-zinc-400 truncate max-w-[150px]">{seekerProfile.title}</p>
                  <span className="text-[8px] font-mono tracking-widest uppercase text-blue-400 block mt-1">HUNTING ACTIVE</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xl h-11 w-11 flex items-center justify-center bg-[#18181b] border border-white/10 rounded-none shrink-0 text-white font-black">
                  {companyProfile.logo}
                </span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">{companyProfile.name}</h3>
                  <p className="text-[10px] text-zinc-400 truncate max-w-[150px]">{companyProfile.tagline}</p>
                  <span className="text-[8px] font-mono tracking-widest uppercase text-blue-450 block mt-1">RECRUITING OFFICE</span>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-white/10 text-[10px] text-zinc-400 space-y-2 font-mono uppercase tracking-wider">
              {userType === "seeker" ? (
                <>
                  <div className="flex justify-between">
                    <span>Applications:</span>
                    <span className="text-white font-bold">{applications.length} filed</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bookmarks:</span>
                    <span className="text-white font-bold">{savedJobIds.length} saved</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>My Positions:</span>
                    <span className="text-white font-bold">{jobs.filter(j => j.employerId === "recruiter1" || j.companyName === companyProfile.name).length} posted</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Candidates:</span>
                    <span className="text-white font-bold">{applications.length} total</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sub Navigation lists */}
          <div className="bg-[#111] border border-white/10 rounded-none p-4 space-y-1.5">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block px-2 pb-2 border-b border-white/15 mb-3">
              {userType === "seeker" ? "Job Seeker Portal" : "Employer Backoffice"}
            </span>

            {userType === "seeker" ? (
              <div className="space-y-1">
                <button
                  id="tab_seeker_jobs"
                  onClick={() => setSeekerTab("all-jobs")}
                  className={`w-full py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center justify-between ${
                    seekerTab === "all-jobs"
                      ? "bg-white text-black border-l-2 border-black"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-zinc-400 shrink-0" /> Explore Job Feed</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                </button>

                <button
                  id="tab_seeker_ai"
                  onClick={() => {
                    setSeekerTab("career-coach");
                    setSelectedJobForMatcher(undefined); // reset target analysis
                  }}
                  className={`w-full py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center justify-between ${
                    seekerTab === "career-coach"
                      ? "bg-white text-black border-l-2 border-black"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-500 shrink-0" /> Gemini AI Suite</span>
                  <span className="bg-blue-600/10 font-sans text-[8px] font-bold tracking-widest text-blue-450 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase">Core AI</span>
                </button>

                <button
                  id="tab_seeker_apps"
                  onClick={() => setSeekerTab("my-applications")}
                  className={`w-full py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center justify-between ${
                    seekerTab === "my-applications"
                      ? "bg-white text-black border-l-2 border-black"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-zinc-400 shrink-0" /> My Pipeline</span>
                  <span className="bg-zinc-800 text-[9px] text-zinc-350 font-mono tracking-normal px-2 py-0.5 rounded">{applications.length}</span>
                </button>

                <button
                  id="tab_seeker_saved"
                  onClick={() => setSeekerTab("saved-jobs")}
                  className={`w-full py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center justify-between ${
                    seekerTab === "saved-jobs"
                      ? "bg-white text-black border-l-2 border-black"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2"><Bookmark className="w-4 h-4 text-zinc-400 shrink-0" /> Saved Vacancies</span>
                  <span className="bg-zinc-800 text-[9px] text-zinc-350 font-mono tracking-normal px-2 py-0.5 rounded">{savedJobIds.length}</span>
                </button>

                <button
                  id="tab_seeker_profile"
                  onClick={() => setSeekerTab("seeker-profile")}
                  className={`w-full py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center justify-between ${
                    seekerTab === "seeker-profile"
                      ? "bg-white text-black border-l-2 border-black"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2"><User className="w-4 h-4 text-zinc-400 shrink-0" /> Edit Persona</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <button
                  id="tab_rec_pipeline"
                  onClick={() => setRecruiterTab("dashboard")}
                  className={`w-full py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center justify-between ${
                    recruiterTab === "dashboard"
                      ? "bg-white text-black border-l-2 border-black"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-zinc-400 shrink-0" /> Review Board</span>
                  <span className="bg-zinc-800 text-[9px] text-zinc-350 font-mono tracking-normal px-2 py-0.5 rounded">{applications.length}</span>
                </button>

                <button
                  id="tab_rec_post"
                  onClick={() => setRecruiterTab("post-vacancy")}
                  className={`w-full py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center justify-between ${
                    recruiterTab === "post-vacancy"
                      ? "bg-white text-black border-l-2 border-black"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2"><Plus className="w-4 h-4 text-zinc-400 shrink-0" /> Broadcast Vacancy</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                </button>

                <button
                  id="tab_rec_brand"
                  onClick={() => setRecruiterTab("company-profile")}
                  className={`w-full py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center justify-between ${
                    recruiterTab === "company-profile"
                      ? "bg-white text-black border-l-2 border-black"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2"><Building className="w-4 h-4 text-zinc-400 shrink-0" /> Company Profile</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                </button>
              </div>
            )}
          </div>

          {/* Quick FAQ info widget */}
          <div className="bg-[#111] border border-white/10 rounded-none p-5 text-xs space-y-2.5 leading-relaxed">
            <h4 className="font-extrabold uppercase tracking-wide text-zinc-100 flex items-center gap-1.5"><Info className="w-4 h-4 text-blue-500 shrink-0" /> System Guide</h4>
            <p className="text-zinc-400 text-[11px]">Toggle Recruiter Mode to evaluate job postings and test live Gemini compatibility indexing, or use Seeker's AI Suite to optimize cover letters.</p>
          </div>

        </div>

        {/* Major Working Canvas panel - 9 columns */}
        <div className="md:col-span-9 space-y-6">
          
          {userType === "seeker" ? (
            seekerTab === "career-coach" ? (
              <div className="animate-fade-in">
                <AIPortals
                  profile={seekerProfile}
                  jobs={jobs}
                  selectedJobForAnalysis={selectedJobForMatcher}
                  onProfileUpdate={handleUpdateSeekerLocal}
                />
              </div>
            ) : (
              <div className="animate-fade-in">
                <SeekerDashboard
                  profile={seekerProfile}
                  jobs={jobs}
                  savedJobIds={savedJobIds}
                  applications={applications}
                  onProfileUpdate={handleUpdateSeekerLocal}
                  onToggleSaveJob={handleToggleSaveJob}
                  onApplyJob={handleApplyJob}
                  onOpenMatcher={handleOpenMatcherAndRedirect}
                  activeSubSection={seekerTab}
                />
              </div>
            )
          ) : (
            <div className="animate-fade-in">
              <RecruiterDashboard
                company={companyProfile}
                jobs={jobs}
                applications={applications}
                onCompanyUpdate={handleUpdateCompanyLocal}
                onPostJob={handlePostJob}
                onUpdateApplicationStatus={handleUpdateApplicationStatus}
                onStartChat={handleStartChatFromRecruiter}
                activeRecruiterSubTab={recruiterTab}
              />
            </div>
          )}

        </div>

      </main>

      {/* Direct Messaging Slide-Drawer Panel */}
      {isChatPanelOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#0c0c0c] border-l border-white/10 shadow-2xl z-50 flex flex-col p-5 animate-slide-left justify-between">
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <span className="font-extrabold uppercase tracking-wide text-white text-xs flex items-center gap-1.5 leading-none">
                <MessageSquare className="w-4 h-4 text-zinc-300" /> Active Conversations
              </span>
              <button
                onClick={() => setIsChatPanelOpen(false)}
                className="px-2.5 py-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white text-[9px] uppercase tracking-wider font-bold"
              >
                Close Drawer
              </button>
            </div>

            {selectedChatId && activeChatSession ? (
              <div className="flex-1 overflow-hidden">
                <ActiveChat
                  chat={activeChatSession}
                  currentUserId={userType === "seeker" ? "seeker_init" : "recruiter1"}
                  userType={userType}
                  messages={messages[selectedChatId] || []}
                  onSendMessage={handleSendMessage}
                  onBack={() => setSelectedChatId(null)}
                />
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">
                  Available Channels ({chats.length})
                </span>
                {chats.length === 0 ? (
                  <p className="text-zinc-500 text-[10px] uppercase font-semibold text-center py-10">No chats. Apply to jobs to open channels.</p>
                ) : (
                  chats.map(ch => (
                    <div
                      key={ch.id}
                      onClick={() => setSelectedChatId(ch.id)}
                      className="p-4 bg-[#141414] border border-white/5 hover:border-white/20 rounded-none cursor-pointer transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                          {userType === "seeker" ? ch.companyName : ch.seekerName}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate max-w-[220px] mt-1">
                          {ch.lastMessage || "Discussing alignment details..."}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Styled Micro-Footer */}
      <footer className="bg-[#0a0a0a] border-t border-white/10 py-6 text-center text-zinc-500 text-[9px] uppercase tracking-widest">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 HYPER JOBS PLATFORM. POWERED BY FIREBASE & GEMINI COGNITIVE INTELLIGENCE.</p>
          <div className="flex gap-6 font-bold">
            <span className="text-zinc-400 hover:text-white cursor-pointer transition">Terms of Service</span>
            <span className="text-zinc-400 hover:text-white cursor-pointer transition">Privacy Policy</span>
            <span className="text-zinc-400 hover:text-white cursor-pointer transition">Security</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
