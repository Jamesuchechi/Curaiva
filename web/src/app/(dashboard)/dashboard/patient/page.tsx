"use client"

import * as React from "react"
import { MetricCard } from "@/components/ui/metric-card"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/loading"
import { Sparkline } from "@/components/ui/sparkline"
import {
  Activity,
  Pill,
  Smile,
  MessageSquare,
  Mic,
  MicOff,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"
import { ToolTrace, type TraceEntry } from "@/components/ui/tool-trace"
import { TriageAssessment } from "@/types"

/* ── Web Speech API — minimal local types (not in standard lib.dom.d.ts) ── */
interface SpeechRecognitionAlternative {
  readonly transcript: string
}
interface SpeechRecognitionResultItem {
  readonly 0: SpeechRecognitionAlternative
}
type SpeechRecognitionResultList = Iterable<SpeechRecognitionResultItem>
interface SpeechRecognitionEventLocal extends Event {
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: (event: SpeechRecognitionEventLocal) => void
  onend: () => void
  onerror: () => void
  start: () => void
  stop: () => void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance
}

/* ── mood helpers ── */
const MOOD_EMOJIS = ["", "😫","😞","😔","😕","😐","🙂","😊","😄","🤩","🥳"]
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

type MedStatus = "taken" | "missed" | "pending"

interface MedItem {
  id: string
  name: string
  dose: string
  time: string
  status: MedStatus
}

const INITIAL_MEDS: MedItem[] = [
  { id: "med-1", name: "Lisinopril",   dose: "10mg",  time: "08:00", status: "taken"   },
  { id: "med-2", name: "Metformin",    dose: "500mg", time: "13:00", status: "pending" },
  { id: "med-3", name: "Atorvastatin", dose: "20mg",  time: "20:00", status: "pending" },
]

const ACTIVITY = [
  { icon: AlertCircle,   color: "text-red",          bg: "bg-red/10",          title: "Critical Triage Assessment", time: "2 hours ago", desc: "Chest pain reported" },
  { icon: MessageSquare, color: "text-brand-green",   bg: "bg-brand-green/10",  title: "Doctor Response",            time: "Yesterday",    desc: "Dr. Sarah sent a follow-up" },
  { icon: Pill,          color: "text-amber",         bg: "bg-amber/10",        title: "Medication Logged",          time: "Yesterday",    desc: "Lisinopril 10mg taken" },
]

/* ── Mood Tracker Modal ── */
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

/* ── main component ── */
export default function PatientDashboard() {
  const { profile } = useAuth()

  // triage state
  const [symptoms, setSymptoms] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [assessment, setAssessment] = React.useState<TriageAssessment | null>(null)
  const [triageError, setTriageError] = React.useState<string | null>(null)
  const [trace, setTrace] = React.useState<TraceEntry[]>([])

  // voice
  const [isRecording, setIsRecording] = React.useState(false)
  const recognitionRef = React.useRef<SpeechRecognitionInstance | null>(null)

  // consult
  const [connecting, setConnecting] = React.useState(false)
  const [consultSuccess, setConsultSuccess] = React.useState(false)

  // medications
  const [meds, setMeds] = React.useState<MedItem[]>(INITIAL_MEDS)
  const [loggingMed, setLoggingMed] = React.useState<string | null>(null)

  // mood
  const [showMoodModal, setShowMoodModal] = React.useState(false)
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const [moodData, setMoodData] = React.useState<(number | null)[]>([6, 7, 5, 8, 7, null, null])

  /* ── tool trace helpers ── */
  const addTrace = (entry: Omit<TraceEntry, "id" | "timestamp">): string => {
    const id = Math.random().toString(36).substring(7)
    setTrace(prev => [{ ...entry, id, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }, ...prev])
    return id
  }
  const updateTrace = (id: string, updates: Partial<TraceEntry>) =>
    setTrace(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))

  /* ── voice input ── */
  const toggleVoice = () => {
    if (typeof window === "undefined") return

    const win = window as unknown as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }

    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      alert("Voice input is not supported in this browser. Please try Chrome.")
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: SpeechRecognitionEventLocal) => {
      const transcript = Array.from(event.results)
        .map((r: SpeechRecognitionResultItem) => r[0].transcript)
        .join("")
      setSymptoms(transcript)
    }
    recognition.onend = () => setIsRecording(false)
    recognition.onerror = () => setIsRecording(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }

  /* ── triage ── */
  const handleTriage = async () => {
    if (!symptoms.trim()) return
    setLoading(true)
    setTriageError(null)
    setAssessment(null)
    setConsultSuccess(false)

    const patientId = profile?.fhir_patient_id || "592903"
    const tid = addTrace({ tool: "triage_patient", status: "pending", resources: ["Patient", "Observation", "Condition"] })
    const t0 = Date.now()

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms, patient_id: patientId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAssessment(data.assessment)
      updateTrace(tid, { status: "success", duration: Date.now() - t0 })
    } catch (err: unknown) {
      setTriageError(err instanceof Error ? err.message : "Unexpected error")
      updateTrace(tid, { status: "error", duration: Date.now() - t0 })
    } finally {
      setLoading(false)
    }
  }

  /* ── connect to doctor ── */
  const handleConnectDoctor = async () => {
    if (!assessment) return
    setConnecting(true)
    const tid = addTrace({ tool: "create_consultation", status: "pending", resources: ["consultations"] })
    const t0 = Date.now()
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_summary: `${assessment.primary_concern} — ${assessment.recommended_action}`,
          priority: assessment.severity,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setConsultSuccess(true)
      updateTrace(tid, { status: "success", duration: Date.now() - t0 })
    } catch {
      updateTrace(tid, { status: "error", duration: Date.now() - t0 })
    } finally {
      setConnecting(false)
    }
  }

  /* ── log dose ── */
  const handleLogDose = async (med: MedItem) => {
    setLoggingMed(med.id)
    try {
      await fetch("/api/medications/log", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medication_id: med.id, log_id: `${med.id}-${Date.now()}` }),
      })
      // optimistic update regardless of server response
      setMeds(prev => prev.map(m => m.id === med.id ? { ...m, status: "taken" as MedStatus } : m))
    } finally {
      setLoggingMed(null)
    }
  }

  /* ── save mood ── */
  const handleSaveMood = async (score: number) => {
    setShowMoodModal(false)
    const next = [...moodData]
    next[todayIdx] = score
    setMoodData(next)

    const patientId = profile?.fhir_patient_id || "592903"
    await fetch("/api/mental-health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patientId, mood_score: score }),
    }).catch(() => {/* fire-and-forget */})
  }

  const sparklineData = moodData.map(v => v ?? 0)
  const takenCount = meds.filter(m => m.status === "taken").length
  const adherencePct = Math.round((takenCount / meds.length) * 100)
  const streak = 6 // would be computed from DB in production

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Metric Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Health Score" value="84/100" trend={{ value: 4, label: "from last week", direction: "up" }} icon={<Activity className="w-5 h-5" />} color="teal" />
        <MetricCard label="Medication Adherence" value={`${adherencePct}%`} trend={{ value: 2, label: "missed 1 dose", direction: "down" }} icon={<Pill className="w-5 h-5" />} color="amber" />
        <MetricCard label="Today's Mood" value={moodData[todayIdx] ? `${moodData[todayIdx]}/10` : "—"} trend={{ value: 0.5, label: "improving", direction: "up" }} icon={<Smile className="w-5 h-5" />} color="purple" />
        <MetricCard label="Consultations" value="2" trend={{ value: 1, label: "awaiting reply", direction: "up" }} icon={<MessageSquare className="w-5 h-5" />} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT — Triage + Mood + Activity */}
        <div className="lg:col-span-2 space-y-6">

          {/* AI Triage Panel */}
          <Card className="glass border-brand-lime/20 overflow-hidden">
            <CardHeader className="bg-brand-lime/5 border-b border-brand-lime/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">AI Symptom Triage</CardTitle>
                  <CardDescription>Describe how you&apos;re feeling for an immediate AI assessment</CardDescription>
                </div>
                <Badge variant="new">Powered by Claude</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="relative">
                <textarea
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  placeholder="Describe your symptoms (e.g., 'I have had a dull headache for 2 days and feel slightly nauseous...')"
                  className="w-full h-32 p-4 pr-14 rounded-xl bg-surface/50 border border-border-base focus:border-brand-lime outline-none transition-all resize-none text-text-light placeholder:text-text-muted/50"
                />
                <button
                  onClick={toggleVoice}
                  title={isRecording ? "Stop Recording" : "Voice Input"}
                  className={cn(
                    "absolute bottom-4 right-4 p-2 rounded-full transition-all",
                    isRecording
                      ? "bg-red/20 text-red animate-pulse"
                      : "bg-surface-2 text-text-muted hover:text-red hover:bg-red/10"
                  )}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                  {isRecording && <span className="text-red mr-2">● RECORDING</span>}
                  {symptoms.length} characters
                </span>
                <Button onClick={handleTriage} disabled={loading || !symptoms.trim()} className="gap-2">
                  {loading ? <Spinner size="sm" className="border-bg" /> : <><Send className="w-4 h-4" /> Assess Symptoms</>}
                </Button>
              </div>

              {triageError && (
                <div className="p-4 rounded-xl bg-red/10 border border-red/20 text-red text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" /><p>{triageError}</p>
                </div>
              )}

              {assessment && (
                <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={assessment.severity === "critical" ? "critical" : assessment.severity === "moderate" ? "moderate" : "low"}>
                          {assessment.severity.toUpperCase()} SEVERITY
                        </Badge>
                        <span className="text-xs text-text-muted font-mono">Score: {assessment.severity_score}/10</span>
                      </div>
                      <h4 className="text-lg font-bold text-text-white">{assessment.primary_concern}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h5 className="text-xs font-mono font-bold text-brand-lime uppercase tracking-widest">Recommended Action</h5>
                      <p className="text-sm text-text-light leading-relaxed">{assessment.recommended_action}</p>
                      {assessment.escalate_to_doctor && (
                        consultSuccess ? (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-teal/10 border border-teal/20 text-teal text-sm font-semibold">
                            <CheckCircle2 className="w-4 h-4" /> Consultation request sent!
                          </div>
                        ) : (
                          <Button
                            variant="primary"
                            className="w-full mt-4 group"
                            disabled={connecting}
                            onClick={handleConnectDoctor}
                          >
                            {connecting ? <Spinner size="sm" className="border-bg mr-2" /> : null}
                            Connect to Doctor <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        )
                      )}
                    </div>
                    <div className="space-y-3">
                      <h5 className="text-xs font-mono font-bold text-brand-lime uppercase tracking-widest">Self-Care Steps</h5>
                      <ul className="space-y-2">
                        {assessment.self_care_steps.map((step: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 text-teal shrink-0" />{step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {assessment.red_flags.length > 0 && (
                    <div className="p-4 rounded-xl bg-red/5 border border-red/20">
                      <h5 className="text-xs font-mono font-bold text-red uppercase tracking-widest mb-3">Red Flags (Seek Immediate Care)</h5>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                        {assessment.red_flags.map((flag: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-red/80 font-medium">
                            <span className="w-1 h-1 rounded-full bg-red mt-1.5 shrink-0" />{flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border-base flex items-center justify-between">
                    <span className="text-[10px] font-mono text-text-muted">
                      Source: FHIR Patient {profile?.fhir_patient_id || "592903"} · Claude via MCP
                    </span>
                    <p className="text-[10px] text-text-muted italic max-w-xs text-right">{assessment.disclaimer}</p>
                  </div>
                </div>
              )}
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
                  const val = moodData[i]
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
              <Sparkline data={sparklineData} color="var(--lime)" height={40} />
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-semibold px-1">Recent Activity</h3>
            <div className="space-y-3">
              {ACTIVITY.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border-base hover:border-border-base-2 transition-all">
                  <div className={cn("p-2.5 rounded-xl shrink-0", item.bg, item.color)}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-semibold text-sm truncate">{item.title}</p>
                      <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.time}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full text-xs py-2">View Full History</Button>
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
              <div className="space-y-3">
                {meds.map(med => (
                  <div key={med.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-2/50 border border-border-base">
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
                        onClick={() => handleLogDose(med)}
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
              {streak >= 5 && (
                <div className="p-3 rounded-xl bg-brand-lime/10 border border-brand-lime/20 text-center">
                  <p className="text-xs font-bold text-brand-lime">🔥 {streak}-day streak!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mental Health Support Card */}
          <Card className="bg-surface border-border-base">
            <CardContent className="p-6 space-y-4 text-center">
              <div className="p-3 bg-purple/10 text-purple rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <Smile className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Need someone to talk to?</h4>
                <p className="text-xs text-text-muted mt-1">AI-powered mental health support available 24/7.</p>
              </div>
              <Button variant="secondary" className="w-full text-xs" onClick={() => setShowMoodModal(true)}>
                Start Session
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mood Modal */}
      {showMoodModal && (
        <MoodModal onClose={() => setShowMoodModal(false)} onSave={handleSaveMood} />
      )}

      {/* Live Tool Trace */}
      <ToolTrace entries={trace} />
    </div>
  )
}
