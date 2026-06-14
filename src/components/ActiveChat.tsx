import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Send, ArrowLeft, MessageSquare, AlertCircle } from "lucide-react";
import { ChatSession, ChatMessage } from "../types";

interface ActiveChatProps {
  chat: ChatSession;
  currentUserId: string; // "seeker_init" or "recruiter1"
  userType: "seeker" | "recruiter";
  messages: ChatMessage[];
  onSendMessage: (chatId: string, text: string) => void;
  onBack: () => void;
}

export function ActiveChat({ chat, currentUserId, userType, messages, onSendMessage, onBack }: ActiveChatProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(chat.id, inputText.trim());
    setInputText("");
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div id={`active_chat_${chat.id}`} className="bg-[#0e1724] border border-[#213554] rounded-xl overflow-hidden flex flex-col h-[520px]">
      {/* Header */}
      <div className="bg-[#131d2e] p-4 border-b border-[#213554] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-10 h-10 rounded-full bg-blue-900 border border-blue-700 flex items-center justify-center font-bold text-white uppercase font-mono">
            {userType === "seeker" ? chat.companyName.slice(0, 2) : chat.seekerName.slice(0, 2)}
          </div>

          <div>
            <h3 className="text-slate-200 text-sm font-bold">
              {userType === "seeker" ? chat.companyName : chat.seekerName}
            </h3>
            <p className="text-slate-500 text-xs">
              Regarding {chat.jobTitle} vacancy
            </p>
          </div>
        </div>

        <span className="text-[10px] bg-blue-955/40 text-blue-400 font-mono border border-blue-900/50 px-2 py-0.5 rounded uppercase">
          {userType === "seeker" ? "Recruiter Chat" : "Applicant Chat"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#080d15]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <MessageSquare className="w-10 h-10 text-slate-650 mb-2" />
            <p className="text-slate-400 text-xs">No messages yet. Send a message to initiate the discussion!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = (userType === "seeker" && msg.senderType === "seeker") || 
                         (userType === "recruiter" && msg.senderType === "recruiter");
            
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 text-xs leading-relaxed ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-[#131d2e] border border-[#1e2f49] text-slate-200 rounded-bl-none"
                  }`}
                >
                  <span className="block text-[9px] uppercase tracking-wider font-semibold opacity-60 mb-0.5">
                    {msg.senderName}
                  </span>
                  <p>{msg.text}</p>
                  <span className="block text-[8px] opacity-40 text-right mt-1 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div className="p-3 bg-[#131d2e] border-t border-[#213554] flex gap-2">
        <input
          id="chat_input_msg"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-[#090f19] text-slate-200 border border-[#213554] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-650"
          placeholder="Type professional response..."
        />
        <button
          id="btn_chat_send"
          disabled={!inputText.trim()}
          onClick={handleSend}
          className="px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}
