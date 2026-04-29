"use client"

import * as React from "react"
import { StatusDot } from "@/components/ui/feedback"
import { Button } from "@/components/ui/button"
import { Bell, Search, Send, X, Activity } from "lucide-react"
import { Profile } from "@/types"
import { cn } from "@/lib/utils"

export function Topbar({ title, profile }: { title: string, profile: Profile | null }) {
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [showAIAssist, setShowAIAssist] = React.useState(false)
  const [aiMessage, setAiMessage] = React.useState("")
  const [chatLog, setChatLog] = React.useState<{role: "user" | "ai", text: string}[]>([
    { role: "ai", text: "Hello! I am Curaiva AI. How can I assist you with your health today?" }
  ])

  const handleSendAI = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiMessage.trim()) return
    const msg = aiMessage.toLowerCase()
    setChatLog(prev => [...prev, { role: "user", text: aiMessage }])
    setAiMessage("")
    
    // Dynamic mock responses
    setTimeout(() => {
      let response = "I have recorded your update to your health record. Would you like me to schedule a consultation or notify your Community Health Worker?"
      
      if (msg.includes("hello") || msg.includes("hi")) {
        response = "Hello! I'm your clinical assistant. I can help you track medications, log symptoms, or prepare for your next consultation. What's on your mind?"
      } else if (msg.includes("medication") || msg.includes("pill") || msg.includes("dose")) {
        response = "I can see your current prescriptions in your FHIR records. Are you having trouble with adherence, or are you experiencing side effects?"
      } else if (msg.includes("pain") || msg.includes("hurt") || msg.includes("sick")) {
        response = "I'm sorry you're not feeling well. I've flagged this for your care team. Should we run a quick triage assessment now?"
      } else if (msg.includes("appointment") || msg.includes("doctor") || msg.includes("consultation")) {
        response = "I can help you prepare for your visit. I'll generate a summary of your recent logs for Dr. Nwosu to review."
      }
      
      setChatLog(prev => [...prev, { role: "ai", text: response }])
    }, 1000)
  }

  return (
    <header className="h-16 border-b border-border-base bg-bg/50 backdrop-blur-md sticky top-0 z-20 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-display font-bold">{title}</h1>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-border-base">
          <StatusDot status="online" />
          <span className="text-[10px] font-mono font-medium text-text-muted uppercase tracking-wider">
            {profile?.fhir_patient_id ? `FHIR ID: ${profile.fhir_patient_id}` : "FHIR Connected"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 mr-2 px-3 py-1 rounded-lg bg-brand-lime/10 border border-brand-lime/20">
          <span className="text-[10px] font-mono font-bold text-brand-lime uppercase tracking-widest">
            {profile?.role || 'Guest'}
          </span>
        </div>

        <div className="relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-brand-lime transition-colors" />
          <input 
            type="text" 
            placeholder="Search records..." 
            className="h-10 w-64 pl-10 pr-4 rounded-xl bg-surface-2 border border-border-base focus:border-brand-lime outline-none text-sm transition-all"
          />
        </div>
        
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red rounded-full animate-pulse" />
          </Button>
          
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border-base rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-border-base bg-surface-2 flex items-center justify-between">
                <h3 className="font-bold">Notifications</h3>
                <span className="text-xs bg-red text-white px-2 py-0.5 rounded-full font-bold">2 New</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="p-4 border-b border-border-base hover:bg-surface-2 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-red" />
                    <span className="text-xs font-bold text-red uppercase">Action Required</span>
                  </div>
                  <p className="text-sm font-medium">Missed Metformin Dose</p>
                  <p className="text-xs text-text-muted mt-1">Please log your 13:00 dose to maintain your adherence score.</p>
                </div>
                <div className="p-4 hover:bg-surface-2 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-brand-lime" />
                    <span className="text-xs font-bold text-brand-lime uppercase">Update</span>
                  </div>
                  <p className="text-sm font-medium">Dr. Nwosu reviewed your chart</p>
                  <p className="text-xs text-text-muted mt-1">A pre-consultation brief was generated for your upcoming visit.</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <Button variant="primary" size="sm" className="hidden sm:flex bg-brand-lime text-bg font-bold" onClick={() => setShowAIAssist(true)}>
          AI Assist
        </Button>
      </div>

      {/* AI Assist Sidebar */}
      {showAIAssist && (
        <>
          <div className="fixed inset-0 bg-bg/40 backdrop-blur-[2px] z-40 animate-in fade-in" onClick={() => setShowAIAssist(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-surface border-l border-border-base z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-border-base bg-surface-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-lime flex items-center justify-center text-bg">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Curaiva Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-lime animate-pulse" />
                    <p className="text-[10px] text-text-muted">Clinical Orchestrator · Online</p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowAIAssist(false)} className="rounded-full hover:bg-surface-2">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-bg/30">
              <div className="text-[10px] text-center text-text-muted font-mono uppercase tracking-widest mb-4">
                Clinical Session Started · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {chatLog.map((msg, i) => (
                <div key={i} className={cn(
                  "max-w-[85%] rounded-2xl p-3 text-sm shadow-sm",
                  msg.role === "ai" 
                    ? "bg-surface-2 border border-border-base text-text-light mr-auto rounded-tl-sm" 
                    : "bg-brand-lime text-bg ml-auto rounded-tr-sm font-medium"
                )}>
                  {msg.text}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border-base bg-surface-2">
              <form onSubmit={handleSendAI} className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    placeholder="Ask about your health..."
                    className="w-full h-11 pl-4 pr-10 rounded-xl bg-surface border border-border-base focus:border-brand-lime outline-none text-sm transition-all shadow-inner"
                  />
                  <Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 text-brand-lime hover:bg-brand-lime/10 h-9 w-9">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
              <p className="text-[10px] text-center text-text-muted mt-3">
                Assistant has access to your FHIR records and SHARP context.
              </p>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
