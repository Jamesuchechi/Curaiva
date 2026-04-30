"use client"

import * as React from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { useAIPanel } from "@/components/providers/ai-panel-provider"
import { useMentalHealthData } from "@/hooks/use-mental-health-data"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner, Skeleton } from "@/components/ui/loading"
import { Brain, Heart, TrendingUp, Mic, Sparkles, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

const MOODS = [
  { score: 1, emoji: "😔", label: "Very Low" },
  { score: 3, emoji: "😕", label: "Low" },
  { score: 5, emoji: "😐", label: "Neutral" },
  { score: 7, emoji: "🙂", label: "Good" },
  { score: 9, emoji: "😄", label: "Great" },
]

export default function MentalHealthPage() {
  const { profile } = useAuth()
  const { setPageContext, open } = useAIPanel()
  const { data, loading, error, refetch, supabase } = useMentalHealthData(profile?.id)
  
  const [selectedMood, setSelectedMood] = React.useState(5)
  const [notes, setNotes] = React.useState("")
  const [isRecording, setIsRecording] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  // Inject context to AI Panel when data changes
  React.useEffect(() => {
    if (data) {
      setPageContext({
        avgMoodScore7Days: data.avgMood,
        recentMoodLogs: data.trendChart.filter(t => t.score !== null).map(t => `${t.dayLabel}: ${t.score}/10 - ${t.notes || "No notes"}`),
        activeStreak: data.streak
      })
    }
  }, [data, setPageContext])

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false)
      // Fake transcription for demo purposes
      setNotes(prev => prev + (prev ? " " : "") + "I've been feeling really overwhelmed with work lately and finding it hard to sleep.")
    } else {
      setIsRecording(true)
    }
  }

  const startSession = async () => {
    setSaving(true)
    const finalNotes = notes.trim() || "Just checking in."
    const isCrisis = selectedMood <= 3 || finalNotes.toLowerCase().includes("overwhelmed") || finalNotes.toLowerCase().includes("hopeless")

    try {
      // 1. Save to database
      if (profile?.id) {
        await supabase.from("mental_health_sessions").insert({
          patient_id: profile.id,
          mood_score: selectedMood,
          session_notes: finalNotes,
          crisis_flagged: isCrisis
        })
        refetch()
      }

      // 2. Open the AI Assistant with a structured prompt
      open(`I would like to start a mental health check-in session. My current mood score is ${selectedMood}/10. Notes: ${finalNotes}. Please provide empathetic support and CBT strategies if applicable.`)
      
      // 3. Reset form
      setNotes("")
      setSelectedMood(5)
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red/10 border border-red/20 text-red flex items-center justify-between">
        <div>
          <h3 className="font-bold">Failed to load mental health data</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>Try Again</Button>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 pb-20">
        <div className="flex-1 space-y-8">
          <Skeleton className="h-20 w-64 rounded-xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
        <div className="lg:w-80 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 pb-20">
      <div className="flex-1 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-white">Mental Health</h1>
          <p className="text-text-muted mt-1">AI-powered emotional wellbeing support · Interoperable FHIR Analysis</p>
        </div>

        {/* AI Insight */}
        {data.avgMood > 0 && data.avgMood < 6 && (
          <div className="p-4 rounded-2xl bg-surface-2 border border-brand-lime/20 flex items-start gap-3 relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-r from-brand-lime/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="w-5 h-5 text-brand-lime shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-brand-lime">AI Insight</p>
              <p className="text-sm text-text-light mt-1">We noticed your mood has been lower than usual this week. Consider exploring the breathing exercises in the AI Assistant or scheduling a quick consultation.</p>
            </div>
          </div>
        )}

        {/* Mood trend summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Avg Mood (7d)", value: data.avgMood > 0 ? `${data.avgMood}/10` : "—", icon: <TrendingUp className="w-4 h-4" />, color: "text-teal" },
            { label: "Sessions This Week", value: data.sessionsThisWeek.toString(), icon: <Brain className="w-4 h-4" />, color: "text-purple" },
            { label: "Streak", value: `${data.streak} days`, icon: <Heart className="w-4 h-4" />, color: "text-brand-lime" },
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
            {data.trendChart.every(t => t.score === null) ? (
              <p className="text-sm text-text-muted text-center py-8">No mood data recorded in the last 7 days.</p>
            ) : (
              <div className="flex items-end gap-3 h-32 pt-6">
                {data.trendChart.map((t, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip */}
                    {t.score !== null && (
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10 w-40 bg-surface-2 border border-border-base rounded-xl p-3 shadow-xl translate-y-2 group-hover:translate-y-0">
                        <p className="text-xs font-bold text-center mb-1">Score: {t.score}/10</p>
                        {t.notes && <p className="text-[10px] text-text-muted text-center leading-tight line-clamp-3">&quot;{t.notes}&quot;</p>}
                      </div>
                    )}
                    
                    <div
                      className={cn(
                        "w-full rounded-t-lg transition-all duration-500", 
                        t.score === null ? "bg-transparent" :
                        t.score >= 7 ? "bg-teal/60 group-hover:bg-teal" : 
                        t.score >= 5 ? "bg-brand-lime/40 group-hover:bg-brand-lime" : 
                        "bg-amber/40 group-hover:bg-amber"
                      )}
                      style={{ height: t.score !== null ? `${(t.score / 10) * 100}px` : '4px', opacity: t.score === null ? 0.1 : 1 }}
                    />
                    <span className="text-[10px] font-mono font-bold text-text-muted">{t.dayLabel}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Intake Form */}
        <Card className="glass border-purple/20 relative overflow-hidden">
          <CardHeader className="pb-4 border-b border-border-base bg-surface-2/30 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple/20 flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold">Start AI Support Session</h2>
                <p className="text-xs text-text-muted">Log your mood and chat with Curaiva AI for emotional support</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 relative z-10 pt-6">
            <div className="space-y-4 mb-4">
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
            
            <div className="space-y-3 mb-6">
              <label className="text-sm font-medium text-text-light">What&apos;s on your mind? <span className="text-text-muted font-normal">(optional)</span></label>
              <div className="relative group">
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                  placeholder="Share what you're experiencing today..."
                  className="w-full p-4 pr-16 rounded-2xl bg-surface-2 border border-border-base focus:border-purple outline-none resize-none text-sm text-text-light placeholder:text-text-muted/50 transition-all shadow-inner"
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
            
            <Button onClick={startSession} disabled={saving || isRecording} className="w-full h-14 rounded-2xl font-bold text-lg gap-2 bg-purple hover:bg-purple/90 text-white shadow-xl transition-all active:scale-95">
              {saving ? <><Spinner size="sm" className="border-white" /> Connecting to AI Therapist…</> : <><Brain className="w-5 h-5" /> Begin CBT Session</>}
            </Button>
          </CardContent>
        </Card>

        <p className="text-[10px] font-mono text-text-muted text-center">
          FHIR ID: {profile?.fhir_patient_id ?? "592903"} · AI support via mental_health_assessment MCP · Not a substitute for professional care
        </p>
      </div>

      {/* Clinical Context Sidebar */}
      <div className="lg:w-80 space-y-6">
        <Card className="glass border-brand-lime/20 overflow-hidden">
          <div className="bg-brand-lime/10 p-4 border-b border-brand-lime/20">
            <h3 className="text-xs font-bold text-brand-lime uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3 h-3" /> Clinical Context
            </h3>
          </div>
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="text-[10px] text-text-muted font-mono uppercase">Primary Care Physician</p>
              <p className="text-sm font-bold text-text-white">Dr. Sarah Nwosu</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted font-mono uppercase">Last Assessment</p>
              <p className="text-sm font-bold text-text-white">
                {data.logs.length > 0 ? `${new Date(data.logs[0].dateStr).toLocaleDateString()} · ${data.logs[0].score >= 6 ? 'Stable' : 'Monitored'}` : "No recent data"}
              </p>
            </div>
            <div className="pt-2 border-t border-border-base">
              <p className="text-[10px] text-text-muted font-mono uppercase mb-2">Connected Resources</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-text-light hover:text-brand-lime cursor-pointer transition-colors">
                  <div className="w-1 h-1 rounded-full bg-brand-lime" />
                  Crisis Support Line
                </div>
                <div className="flex items-center gap-2 text-xs text-text-light hover:text-brand-lime cursor-pointer transition-colors">
                  <div className="w-1 h-1 rounded-full bg-brand-lime" />
                  Local Community Clinic
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-purple/20">
          <div className="bg-purple/10 p-4 border-b border-purple/20">
            <h3 className="text-xs font-bold text-purple uppercase tracking-widest flex items-center gap-2">
              <Brain className="w-3 h-3" /> AI Analysis Mode
            </h3>
          </div>
          <CardContent className="p-4">
            <p className="text-xs text-text-muted leading-relaxed">
              When you begin a session, Curaiva AI analyzes your mood and notes, instantly opening the Assistant Panel to provide empathetic support and CBT strategies based on your historical patterns.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
