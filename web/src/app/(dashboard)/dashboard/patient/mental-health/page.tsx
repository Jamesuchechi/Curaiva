"use client"

import * as React from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/loading"
import { Brain, Heart, AlertCircle, TrendingUp, Mic, Send, PhoneCall, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const MOODS = [
  { score: 1, emoji: "😔", label: "Very Low" },
  { score: 3, emoji: "😕", label: "Low" },
  { score: 5, emoji: "😐", label: "Neutral" },
  { score: 7, emoji: "🙂", label: "Good" },
  { score: 9, emoji: "😄", label: "Great" },
]

const WEEK_MOODS = [6, 5, 7, 4, 8, 7, 6]
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const PAST_JOURNALS = [
  "Felt pretty average today.",
  "A bit anxious about work.",
  "Had a great walk outside!",
  "Struggled to get out of bed.",
  "Productive and energetic.",
  "Relaxed weekend vibes.",
  "Preparing for the week."
]

export default function MentalHealthPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<{ crisis_detected: boolean; recommendation: string; resources: string[] } | null>(null)
  const [selectedMood, setSelectedMood] = React.useState(5)
  const [notes, setNotes] = React.useState("")
  const [sessionDone, setSessionDone] = React.useState(false)
  const [isRecording, setIsRecording] = React.useState(false)
  const [chatLog, setChatLog] = React.useState<{role: 'user'|'ai', text: string}[]>([])
  const [replyText, setReplyText] = React.useState("")
  const chatRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll chat
  React.useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatLog])

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false)
      // Fake transcription
      setNotes(prev => prev + (prev ? " " : "") + "I've been feeling really overwhelmed with work lately and finding it hard to sleep.")
    } else {
      setIsRecording(true)
    }
  }

  const startSession = async () => {
    if (!notes.trim()) setNotes("Feeling okay today, just checking in.")
    setLoading(true)
    setResult(null)
    setChatLog([{ role: 'user', text: `Mood: ${selectedMood}/10. ${notes || "Just checking in."}` }])
    
    try {
      const res = await fetch("/api/mental-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: profile?.fhir_patient_id ?? "592903",
          mood_score: selectedMood,
          session_notes: notes,
        }),
      })
      const data = await res.json()
      if (!data.error) {
        setResult(data)
        setChatLog(prev => [...prev, { role: 'ai', text: data.recommendation }])
        setSessionDone(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setChatLog(prev => [...prev, { role: 'user', text: replyText }])
    setReplyText("")
    
    // Fake AI conversational reply
    setTimeout(() => {
      setChatLog(prev => [...prev, { role: 'ai', text: `I understand. It sounds like you're experiencing a lot right now. Let's try to focus on one small positive step today. Would you like me to guide you through a quick grounding exercise?` }])
    }, 1500)
  }

  const avgMood = Math.round(WEEK_MOODS.reduce((a, b) => a + b, 0) / WEEK_MOODS.length)

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-display font-bold text-text-white">Mental Health</h1>
        <p className="text-text-muted mt-1">AI-powered emotional wellbeing support, available 24/7</p>
      </div>

      {/* AI Insight */}
      <div className="p-4 rounded-2xl bg-surface-2 border border-brand-lime/20 flex items-start gap-3 relative overflow-hidden group">
        <div className="absolute inset-0 bg-linear-to-r from-brand-lime/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Sparkles className="w-5 h-5 text-brand-lime shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-brand-lime">AI Insight</p>
          <p className="text-sm text-text-light mt-1">Your mood historically dips on Thursdays. We&apos;ve prepared a 5-minute breathing exercise in your resources section to help you preemptively decompress today.</p>
        </div>
      </div>

      {/* Mood trend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Avg Mood (7d)", value: `${avgMood}/10`, icon: <TrendingUp className="w-4 h-4" />, color: "text-teal" },
          { label: "Sessions This Week", value: "3", icon: <Brain className="w-4 h-4" />, color: "text-purple" },
          { label: "Streak", value: "5 days", icon: <Heart className="w-4 h-4" />, color: "text-brand-lime" },
        ].map(s => (
          <Card key={s.label} className="glass p-5 flex items-center gap-4 transition-all hover:-translate-y-1 hover:shadow-lg">
            <div className={cn("p-2 rounded-xl bg-surface-2", s.color)}>{s.icon}</div>
            <div>
              <p className="text-xs text-text-muted">{s.label}</p>
              <p className={cn("text-2xl font-display font-bold", s.color)}>{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* 7-day bar chart */}
      <Card className="glass">
        <CardHeader className="pb-2">
          <h2 className="text-lg font-display font-semibold">7-Day Mood Trend</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-32 pt-6">
            {WEEK_MOODS.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10 w-32 bg-surface-2 border border-border-base rounded-xl p-2 shadow-xl translate-y-2 group-hover:translate-y-0">
                  <p className="text-xs font-bold text-center mb-1">Score: {v}/10</p>
                  <p className="text-[10px] text-text-muted text-center leading-tight">&quot;{PAST_JOURNALS[i]}&quot;</p>
                </div>
                
                <div
                  className={cn("w-full rounded-t-lg transition-all duration-500", v >= 7 ? "bg-teal/60 group-hover:bg-teal" : v >= 5 ? "bg-brand-lime/40 group-hover:bg-brand-lime" : "bg-amber/40 group-hover:bg-amber")}
                  style={{ height: `${(v / 10) * 100}px` }}
                />
                <span className="text-[10px] font-mono font-bold text-text-muted">{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Session form or Chat UI */}
      <Card className={cn("glass transition-all duration-500 relative overflow-hidden", sessionDone && result?.crisis_detected ? "border-red shadow-[0_0_30px_rgba(255,0,0,0.15)]" : "border-purple/20")}>
        {sessionDone && result?.crisis_detected && (
          <div className="absolute inset-0 bg-red/5 pointer-events-none animate-pulse" />
        )}
        
        <CardHeader className="pb-2 relative z-10">
          <div className="flex items-center gap-3">
            {sessionDone && result?.crisis_detected ? (
              <AlertCircle className="w-5 h-5 text-red animate-bounce" />
            ) : (
              <Brain className="w-5 h-5 text-purple" />
            )}
            <h2 className="text-lg font-display font-semibold">
              {sessionDone ? (result?.crisis_detected ? "Crisis Protocol Activated" : "Active Therapy Session") : "Start AI Support Session"}
            </h2>
          </div>
          <p className="text-sm text-text-muted">
            {sessionDone ? "Curaiva AI is providing real-time cognitive support" : "Our AI will assess your mood and provide personalised support recommendations"}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 relative z-10">
          {sessionDone && result ? (
            <div className="flex flex-col h-[500px] bg-surface-2 rounded-2xl border border-border-base overflow-hidden">
              {/* Chat History */}
              <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {result.crisis_detected && (
                  <div className="p-4 mb-4 rounded-xl bg-red/10 border border-red/20 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4">
                    <AlertCircle className="w-8 h-8 text-red mb-2" />
                    <p className="font-bold text-red text-lg">Immediate Escalation Required</p>
                    <p className="text-sm text-red/80 mt-1 mb-4">We have detected signs of crisis. Please connect with emergency services immediately.</p>
                    <div className="flex gap-3 w-full">
                      <Button className="flex-1 bg-red text-white hover:bg-red/90 font-bold h-12">
                        <PhoneCall className="w-4 h-4 mr-2" /> Call 911
                      </Button>
                      <Button variant="secondary" className="flex-1 font-bold h-12 border-red/20 text-red hover:bg-red/5">
                        <AlertCircle className="w-4 h-4 mr-2" /> Notify Care Team
                      </Button>
                    </div>
                  </div>
                )}
                
                {chatLog.map((msg, idx) => (
                  <div key={idx} className={cn(
                    "max-w-[85%] rounded-2xl p-4 text-sm animate-in fade-in slide-in-from-bottom-2",
                    msg.role === "ai" 
                      ? "bg-surface border border-border-base text-text-light mr-auto rounded-tl-sm" 
                      : "bg-purple text-white ml-auto rounded-tr-sm font-medium"
                  )}>
                    {msg.text}
                  </div>
                ))}
                
                {result.resources && result.resources.length > 0 && !result.crisis_detected && (
                  <div className="max-w-[85%] mr-auto bg-brand-lime/10 border border-brand-lime/20 rounded-2xl p-4 rounded-tl-sm">
                    <p className="text-xs font-mono font-bold text-brand-lime uppercase mb-2">Recommended Tools</p>
                    <ul className="space-y-2">
                      {result.resources.map((r, i) => (
                        <li key={i} className="text-sm text-text-light flex items-start gap-2">
                          <span className="text-brand-lime mt-0.5">→</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-border-base bg-surface">
                <form onSubmit={handleReply} className="relative flex gap-2">
                  <input 
                    type="text" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response..."
                    className="flex-1 h-12 pl-4 pr-4 rounded-xl bg-surface-2 border border-border-base focus:border-purple outline-none text-sm transition-all"
                  />
                  <Button type="submit" size="icon" className="h-12 w-12 bg-purple text-white hover:bg-purple/90 shrink-0 rounded-xl">
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
                <div className="mt-3 flex justify-center">
                  <Button variant="ghost" size="sm" onClick={() => { setSessionDone(false); setResult(null); setNotes(""); setChatLog([]) }} className="text-xs text-text-muted">
                    End Session
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-4 mb-8">
                <p className="text-sm font-medium text-text-light">How are you feeling right now?</p>
                <div className="flex gap-3">
                  {MOODS.map(m => (
                    <button key={m.score} onClick={() => setSelectedMood(m.score)}
                      className={cn("flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300",
                        selectedMood === m.score ? "border-purple bg-purple/10 scale-105 shadow-lg" : "border-border-base bg-surface hover:bg-surface-2 hover:scale-105"
                      )}>
                      <span className="text-3xl">{m.emoji}</span>
                      <span className={cn("text-xs font-mono font-bold", selectedMood === m.score ? "text-purple" : "text-text-muted")}>
                        {m.score}/10
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3 mb-8">
                <label className="text-sm font-medium text-text-light">What&apos;s on your mind? <span className="text-text-muted font-normal">(optional)</span></label>
                <div className="relative group">
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                    placeholder="Share what you're experiencing today..."
                    className="w-full p-4 pr-16 rounded-2xl bg-surface-2 border border-border-base focus:border-purple outline-none resize-none text-sm text-text-light placeholder:text-text-muted/50 transition-all"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleMicClick}
                    className={cn("absolute bottom-3 right-3 h-10 w-10 rounded-xl transition-all", 
                      isRecording ? "bg-red/10 text-red hover:bg-red/20" : "bg-surface border border-border-base text-text-muted hover:text-purple"
                    )}
                  >
                    {isRecording ? <div className="flex items-center gap-1"><span className="w-1 h-3 bg-red rounded-full animate-pulse" /><span className="w-1 h-4 bg-red rounded-full animate-pulse delay-75" /><span className="w-1 h-3 bg-red rounded-full animate-pulse delay-150" /></div> : <Mic className="w-5 h-5" />}
                  </Button>
                </div>
                {isRecording && <p className="text-xs text-red animate-pulse text-right font-medium">Listening...</p>}
              </div>
              
              <Button onClick={startSession} disabled={loading || isRecording} className="w-full h-14 rounded-2xl font-bold text-lg gap-2 bg-purple hover:bg-purple/90 text-white shadow-xl transition-all active:scale-95">
                {loading ? <><Spinner size="sm" className="border-white" /> Connecting to AI Therapist…</> : <><Brain className="w-5 h-5" /> Begin CBT Session</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-[10px] font-mono text-text-muted text-center">
        FHIR ID: {profile?.fhir_patient_id ?? "592903"} · AI support via mental_health_assessment MCP · Not a substitute for professional care
      </p>
    </div>
  )
}
