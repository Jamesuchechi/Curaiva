"use client"

import * as React from "react"
import { MetricCard } from "@/components/ui/metric-card"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner, Skeleton } from "@/components/ui/loading"
import { Sparkline } from "@/components/ui/sparkline"
import { Activity, Pill, Smile, MessageSquare, Clock, Send, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"
import { useAIPanel } from "@/components/providers/ai-panel-provider"
import { useDashboardData } from "@/hooks/use-dashboard-data"

const MOOD_EMOJIS = ["", "😫","😞","😔","😕","😐","🙂","😊","😄","🤩","🥳"]
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

function MoodModal({ onClose, onSave }: { onClose: () => void; onSave: (score: number) => void }) {
  const [score, setScore] = React.useState(7)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-surface border border-border-base rounded-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg">Log Today&apos;s Mood</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center space-y-2">
          <span className="text-7xl block">{MOOD_EMOJIS[score]}</span>
          <p className="font-mono font-bold text-brand-lime text-2xl">{score}/10</p>
        </div>
        <div className="space-y-2">
          <input
            type="range"
            min={1} max={10}
            value={score}
            onChange={e => setScore(Number(e.target.value))}
            className="w-full h-2 rounded-full accent-lime-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-text-muted font-mono">
            <span>1 – Terrible</span><span>10 – Amazing</span>
          </div>
        </div>
        <Button onClick={() => onSave(score)} className="w-full">Save Mood</Button>
      </div>
    </div>
  )
}

export default function PatientDashboard() {
  const { profile } = useAuth()
  const { data, loading, error, refetch } = useDashboardData(profile?.id)
  const { setPageContext, open } = useAIPanel()
  
  const [showMoodModal, setShowMoodModal] = React.useState(false)
  const [triageInput, setTriageInput] = React.useState("")
  const [loggingMed, setLoggingMed] = React.useState<string | null>(null)

  // Inject context to AI Panel when data changes
  React.useEffect(() => {
    if (data) {
      setPageContext({
        medications: data.medications.map(m => ({
          name: m.name, dose: m.dose, time: m.time, status: m.status
        })),
        moodToday: data.moodToday,
        moodWeek: data.moodWeek,
        adherencePct: data.adherencePct,
        consultationCount: data.consultationCount,
        recentActivity: data.recentActivity.map(a => a.title),
      })
    }
  }, [data, setPageContext])

  const handleTriageSubmit = () => {
    if (!triageInput.trim()) return
    open(`I'm experiencing these symptoms: ${triageInput}. Can you help triage me?`)
    setTriageInput("")
  }

  const handleLogDose = async (medId: string) => {
    setLoggingMed(medId)
    try {
      await fetch("/api/medications/log", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medication_id: medId, status: "taken" }),
      })
      refetch()
    } finally {
      setLoggingMed(null)
    }
  }

  const handleSaveMood = async (score: number) => {
    setShowMoodModal(false)
    await fetch("/api/mental-health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: profile?.id, mood_score: score }),
    })
    refetch()
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red/10 border border-red/20 text-red flex items-center justify-between">
        <div>
          <h3 className="font-bold">Failed to load dashboard</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>Try Again</Button>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Metric Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Health Score" value={`${data.healthScore}/100`} trend={{ value: 4, label: "from last week", direction: "up" }} icon={<Activity className="w-5 h-5" />} color="teal" />
        <MetricCard label="Adherence" value={`${data.adherencePct}%`} trend={data.adherencePct < 100 ? { value: 100 - data.adherencePct, label: "missed doses", direction: "down" } : { value: 0, label: "perfect adherence", direction: "up" }} icon={<Pill className="w-5 h-5" />} color="amber" />
        <MetricCard label="Today's Mood" value={data.moodToday ? `${data.moodToday}/10` : "—"} trend={{ value: 0.5, label: "improving", direction: "up" }} icon={<Smile className="w-5 h-5" />} color="purple" />
        <MetricCard label="Consultations" value={data.openConsultationCount.toString()} trend={{ value: 0, label: "open requests", direction: "up" }} icon={<MessageSquare className="w-5 h-5" />} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT — Triage + Mood + Activity */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Intake Panel (Replaces old massive hardcoded block) */}
          <Card className="glass border-brand-lime/20 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-teal via-brand-lime to-teal opacity-50" />
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-lime" />
                    How are you feeling today?
                  </CardTitle>
                  <CardDescription>Tell Curaiva AI your symptoms for an immediate assessment</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 bg-surface-2/50 p-2 rounded-2xl border border-border-base focus-within:border-brand-lime/50 transition-colors">
                <input 
                  type="text"
                  value={triageInput}
                  onChange={e => setTriageInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTriageSubmit()}
                  placeholder="E.g., I have a headache and feel slightly nauseous..."
                  className="flex-1 bg-transparent border-none outline-none text-sm px-4 text-text-white placeholder:text-text-muted"
                />
                <Button onClick={handleTriageSubmit} disabled={!triageInput.trim()} className="rounded-xl px-6 gap-2">
                  <Send className="w-4 h-4" /> Assess
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mood Tracker */}
          <Card className="glass">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Mood Tracker</CardTitle>
                <CardDescription>7-day wellbeing overview</CardDescription>
              </div>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowMoodModal(true)}>
                Log Today&apos;s Mood
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day, i) => {
                  const val = data.moodWeek[i]
                  const isToday = i === todayIdx
                  return (
                    <div key={day} className={cn(
                      "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all",
                      isToday ? "border-brand-lime bg-brand-lime/10" : "border-border-base bg-surface"
                    )}>
                      <span className="text-[9px] font-mono text-text-muted uppercase">{day}</span>
                      <span className="text-lg">{val ? MOOD_EMOJIS[val] : "·"}</span>
                      <span className={cn(
                        "text-[10px] font-mono font-bold",
                        val && val >= 8 ? "text-teal" : val && val >= 5 ? "text-amber" : "text-text-muted"
                      )}>{val ?? "—"}</span>
                    </div>
                  )
                })}
              </div>
              <Sparkline data={data.moodWeek.map(v => v ?? 0)} color="var(--lime)" height={40} />
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-semibold px-1">Recent Activity</h3>
            <div className="space-y-3">
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">No recent activity.</p>
              ) : (
                data.recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border-base hover:border-border-base-2 transition-all">
                    <div className={cn(
                      "p-2.5 rounded-xl shrink-0",
                      item.severity === 'critical' ? 'bg-red/10 text-red' :
                      item.severity === 'warning' ? 'bg-amber/10 text-amber' :
                      'bg-brand-lime/10 text-brand-lime'
                    )}>
                      {item.eventType.includes('medication') ? <Pill className="w-5 h-5" /> :
                       item.eventType.includes('mood') ? <Smile className="w-5 h-5" /> :
                       item.eventType.includes('consultation') ? <MessageSquare className="w-5 h-5" /> :
                       <Activity className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-semibold text-sm truncate">{item.title}</p>
                        <span className="text-[10px] text-text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 
                          {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted truncate">{item.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT Sidebar */}
        <div className="space-y-6">
          {/* Medications Card */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Today&apos;s Medications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.medications.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">No active medications.</p>
              ) : (
                <div className="space-y-3">
                  {data.medications.map((med, idx) => (
                    <div key={`${med.id}-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-surface-2/50 border border-border-base">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          med.status === "taken" ? "bg-teal" : med.status === "missed" ? "bg-red" : "bg-text-muted"
                        )} />
                        <div>
                          <p className="text-sm font-bold">{med.name}</p>
                          <p className="text-[10px] text-text-muted">{med.dose} • {med.time}</p>
                        </div>
                      </div>
                      {med.status === "pending" && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="h-7 text-[10px] px-3"
                          disabled={loggingMed === med.id}
                          onClick={() => handleLogDose(med.id)}
                        >
                          {loggingMed === med.id ? <Spinner size="sm" className="border-bg" /> : "Log Dose"}
                        </Button>
                      )}
                      {med.status === "taken" && (
                        <span className="text-[10px] text-teal font-medium">✓ Taken</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {data.streak >= 3 && (
                <div className="p-3 rounded-xl bg-brand-lime/10 border border-brand-lime/20 text-center mt-4">
                  <p className="text-xs font-bold text-brand-lime">🔥 {data.streak}-day streak!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Support Prompt */}
          <Card className="bg-surface border-border-base">
            <CardContent className="p-6 space-y-4 text-center">
              <div className="p-3 bg-purple/10 text-purple rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <Smile className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Need someone to talk to?</h4>
                <p className="text-xs text-text-muted mt-1">Curaiva AI provides confidential mental health support.</p>
              </div>
              <Button variant="secondary" className="w-full text-xs" onClick={() => open("I'm feeling a bit overwhelmed and need some support.")}>
                Chat with AI
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {showMoodModal && <MoodModal onClose={() => setShowMoodModal(false)} onSave={handleSaveMood} />}
    </div>
  )
}
