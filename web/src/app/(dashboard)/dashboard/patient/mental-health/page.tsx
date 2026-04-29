"use client"

import * as React from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/loading"
import { Brain, Heart, Smile, AlertCircle, TrendingUp, CheckCircle2 } from "lucide-react"
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

export default function MentalHealthPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<{ crisis_detected: boolean; recommendation: string; resources: string[] } | null>(null)
  const [selectedMood, setSelectedMood] = React.useState(5)
  const [notes, setNotes] = React.useState("")
  const [sessionDone, setSessionDone] = React.useState(false)

  const startSession = async () => {
    setLoading(true)
    setResult(null)
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
        setSessionDone(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const avgMood = Math.round(WEEK_MOODS.reduce((a, b) => a + b, 0) / WEEK_MOODS.length)

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-display font-bold text-text-white">Mental Health</h1>
        <p className="text-text-muted mt-1">AI-powered emotional wellbeing support, available 24/7</p>
      </div>

      {/* Mood trend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Avg Mood (7d)", value: `${avgMood}/10`, icon: <TrendingUp className="w-4 h-4" />, color: "text-teal" },
          { label: "Sessions This Week", value: "3", icon: <Brain className="w-4 h-4" />, color: "text-purple" },
          { label: "Streak", value: "5 days", icon: <Heart className="w-4 h-4" />, color: "text-brand-lime" },
        ].map(s => (
          <Card key={s.label} className="glass p-5 flex items-center gap-4">
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
          <div className="flex items-end gap-3 h-24">
            {WEEK_MOODS.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={cn("w-full rounded-lg transition-all", v >= 7 ? "bg-teal/60" : v >= 5 ? "bg-brand-lime/40" : "bg-amber/40")}
                  style={{ height: `${(v / 10) * 96}px` }}
                />
                <span className="text-[9px] font-mono text-text-muted">{DAYS[i][0]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Session form */}
      <Card className="glass border-purple/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-purple" />
            <h2 className="text-lg font-display font-semibold">Start AI Support Session</h2>
          </div>
          <p className="text-sm text-text-muted">Our AI will assess your mood and provide personalised support recommendations</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {sessionDone && result ? (
            <div className="space-y-4 animate-in fade-in">
              {result.crisis_detected ? (
                <div className="p-4 rounded-xl bg-red/10 border border-red/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red shrink-0" />
                  <div>
                    <p className="font-bold text-red">Immediate Support Recommended</p>
                    <p className="text-sm text-red/80 mt-1">{result.recommendation}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-teal/10 border border-teal/20 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal shrink-0" />
                  <div>
                    <p className="font-bold text-teal">Session Complete</p>
                    <p className="text-sm text-teal/80 mt-1">{result.recommendation}</p>
                  </div>
                </div>
              )}
              {result.resources?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-mono font-bold text-brand-lime uppercase tracking-widest">Recommended Resources</p>
                  <ul className="space-y-2">
                    {result.resources.map((r, i) => (
                      <li key={i} className="text-sm text-text-muted flex items-start gap-2">
                        <span className="text-brand-lime">→</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => { setSessionDone(false); setResult(null); setNotes("") }}>
                Start New Session
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-sm font-medium text-text-light">How are you feeling right now?</p>
                <div className="flex gap-3">
                  {MOODS.map(m => (
                    <button key={m.score} onClick={() => setSelectedMood(m.score)}
                      className={cn("flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all",
                        selectedMood === m.score ? "border-purple bg-purple/10" : "border-border-base bg-surface hover:bg-surface-2"
                      )}>
                      <span className="text-2xl">{m.emoji}</span>
                      <span className={cn("text-[10px] font-mono font-bold", selectedMood === m.score ? "text-purple" : "text-text-muted")}>
                        {m.score}/10
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-light">What&apos;s on your mind? <span className="text-text-muted font-normal">(optional)</span></label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  placeholder="Share what you're experiencing today..."
                  className="w-full p-3 rounded-xl bg-surface border border-border-base focus:border-purple outline-none resize-none text-sm text-text-light placeholder:text-text-muted/50 transition-all"
                />
              </div>
              <Button onClick={startSession} disabled={loading} className="w-full h-12 gap-2">
                {loading ? <><Spinner size="sm" className="border-bg" /> Assessing…</> : <><Smile className="w-4 h-4" /> Start Session</>}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-[10px] font-mono text-text-muted text-center">
        FHIR ID: {profile?.fhir_patient_id ?? "592903"} · AI support via mental_health_assessment MCP · Not a substitute for professional care
      </p>
    </div>
  )
}
