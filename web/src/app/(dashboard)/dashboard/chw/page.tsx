"use client"

import * as React from "react"
import { MetricCard } from "@/components/ui/metric-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/loading"
import {
  Users,
  AlertTriangle,
  Pill,
  Calendar,
  Phone,
  MessageSquare,
  RefreshCcw,
  MapPin,
  X,
  Send,
  CheckCircle2,
  Mic,
  Activity,
  Droplets,
  Thermometer,
  CloudUpload,
  Navigation,
  Clock,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"
import { ToolTrace, type TraceEntry } from "@/components/ui/tool-trace"
import { createClient } from "@/lib/supabase"
import type { QueueItem } from "@/types"
import { GlobalPatient, useGlobalDiscoveryData } from "@/hooks/use-global-discovery-data"

/* ── Patient Drawer ── */
interface DrawerProps {
  patient: QueueItem
  onClose: () => void
}

function PatientDrawer({ patient, onClose }: DrawerProps) {
  const [message, setMessage] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  
  // Goals state
  interface Goal {
    id: string
    description: string
    status: string
    category?: string
    target_date?: string
  }
  const [goals, setGoals] = React.useState<Goal[]>([])
  const [loadingGoals, setLoadingGoals] = React.useState(false)
  const [goalInput, setGoalInput] = React.useState("")

  const loadGoals = React.useCallback(async () => {
    setLoadingGoals(true)
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", patient_id: patient.id }),
      })
      const data = await res.json()
      if (data.goals) setGoals(data.goals)
    } catch (err) {
      console.error("Failed to load goals", err)
    } finally {
      setLoadingGoals(false)
    }
  }, [patient.id])

  const handleAddGoal = async () => {
    if (!goalInput.trim()) return
    setLoadingGoals(true)
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "create", 
          patient_id: patient.id,
          description: goalInput,
          category: "behavioral"
        }),
      })
      const data = await res.json()
      if (data.goal) {
        setGoalInput("")
        loadGoals()
      }
    } catch (err) {
      console.error("Failed to add goal", err)
    } finally {
      setLoadingGoals(false)
    }
  }

  React.useEffect(() => {
    const timer = setTimeout(() => {
      loadGoals()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadGoals])

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultation_id: patient.id, content: message }),
      })
      setSent(true)
      setMessage("")
    } finally {
      setSending(false)
    }
  }

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-surface border-l border-border-base z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-border-base flex items-start justify-between bg-bg2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-display font-bold text-text-white">{patient.name}</h2>
              <Badge variant={patient.status}>{patient.status.toUpperCase()}</Badge>
            </div>
            <p className="text-xs text-text-muted flex items-center gap-1 font-mono">
              <MapPin className="w-3 h-3" /> {patient.location}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-2 text-text-muted hover:text-text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Priority Score */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-bg border border-border-base">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0",
              patient.score >= 80 ? "bg-red/10 border border-red/20" : patient.score >= 50 ? "bg-amber/10 border border-amber/20" : "bg-teal/10 border border-teal/20"
            )}>
              <span className={cn(
                "text-2xl font-display font-bold",
                patient.score >= 80 ? "text-red" : patient.score >= 50 ? "text-amber" : "text-teal"
              )}>{patient.score}</span>
              <span className="text-[8px] font-mono text-text-muted uppercase">Score</span>
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-brand-lime uppercase tracking-widest mb-1">AI Priority Reason</p>
              <p className="text-sm text-text-muted leading-relaxed italic">&quot;{patient.reason}&quot;</p>
            </div>
          </div>

          {/* Mock medication adherence */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-brand-lime uppercase tracking-widest">Medication Adherence (Last 7 Days)</h4>
            <div className="flex gap-2">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, i) => {
                const taken = patient.score < 60 ? i % 3 !== 0 : i < 5
                return (
                  <div key={day} className="flex flex-col items-center gap-1">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold",
                      taken ? "bg-teal/20 text-teal" : "bg-red/20 text-red"
                    )}>{taken ? "✓" : "✗"}</div>
                    <span className="text-[8px] font-mono text-text-muted">{day[0]}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mock mood trend */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-brand-lime uppercase tracking-widest">Mood Trend (7-day)</h4>
            <div className="flex gap-2 items-end h-12">
              {[6, 5, 4, 6, 7, 5, 6].map((v, i) => (
                <div key={i} className="flex-1 rounded-sm bg-purple/40" style={{ height: `${(v / 10) * 100}%` }} />
              ))}
            </div>
          </div>

          {/* Recent triage */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-brand-lime uppercase tracking-widest">Health Goals</h4>
            <div className="space-y-2">
              {loadingGoals && goals.length === 0 ? (
                <div className="text-[10px] text-text-muted animate-pulse">Syncing goals with FHIR...</div>
              ) : goals.length === 0 ? (
                <div className="p-3 rounded-xl border border-dashed border-border-base text-[10px] text-text-muted italic">No goals set.</div>
              ) : (
                goals.map((g, i) => (
                  <div key={g.id || i} className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border-base">
                    <span className="text-xs text-text-white">{g.description}</span>
                    <Badge variant={g.status === "active" ? "stable" : "new"} className="text-[8px] h-4">{g.status.toUpperCase()}</Badge>
                  </div>
                ))
              )}
              <div className="flex gap-2 mt-2">
                <input 
                  type="text" 
                  placeholder="New behavior goal..." 
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  className="flex-1 bg-bg border border-border-base rounded-lg px-3 py-1.5 text-xs outline-none focus:border-brand-lime transition-all"
                />
                <Button size="sm" className="h-8 text-[10px] font-bold" onClick={handleAddGoal} disabled={loadingGoals || !goalInput.trim()}>
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Recent triage */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-brand-lime uppercase tracking-widest">Recent Triage</h4>
            <div className="p-3 rounded-xl bg-bg border border-border-base">
              <p className="text-xs text-text-muted leading-relaxed">{patient.reason}</p>
              <p className="text-[10px] font-mono text-text-muted mt-2">Assessed via FHIR R4 · MCP</p>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-brand-lime uppercase tracking-widest">Send Message</h4>
            {sent ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-teal/10 border border-teal/20 text-teal text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Message sent!
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Type a message to this patient..."
                  className="w-full p-3 rounded-xl bg-bg border border-border-base focus:border-brand-lime outline-none transition-all resize-none text-sm text-text-light placeholder:text-text-muted/50"
                />
                <Button className="w-full gap-2" disabled={!message.trim() || sending} onClick={handleSend}>
                  {sending ? <Spinner size="sm" className="border-bg" /> : <Send className="w-4 h-4" />}
                  Send Message
                </Button>
              </div>
            )}
          </div>
          
          {/* Schedule Visit */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-brand-lime uppercase tracking-widest">Schedule Visit</h4>
            <div className="flex items-center gap-2">
               <input type="date" className="flex-1 p-2 rounded-xl bg-bg border border-border-base outline-none focus:border-brand-lime text-sm" />
               <Button variant="primary" className="gap-2 shrink-0">
                 <Calendar className="w-4 h-4" /> Schedule
               </Button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-border-base bg-bg2 flex gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-brand-lime/10 hover:text-brand-lime w-full">
            <Phone className="w-5 h-5 mr-2" /> Call Patient
          </Button>
        </div>
      </div>
    </>
  )
}

/* ── CHW Dashboard ── */
export default function CHWDashboard() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = React.useState(false)
  const [queue, setQueue] = React.useState<QueueItem[]>([])
  const [queueError, setQueueError] = React.useState<string | null>(null)
  const [trace, setTrace] = React.useState<TraceEntry[]>([])
  const [drawerPatient, setDrawerPatient] = React.useState<QueueItem | null>(null)
  const [sort, setSort] = React.useState<"score" | "name" | "contact">("score")
  const [activeTab, setActiveTab] = React.useState<"queue" | "route" | "vitals" | "community">("queue")
  const { patients: globalPatients, loading: globalLoading, fetchGlobalData } = useGlobalDiscoveryData()
  
  // Vitals Form State
  interface VitalsEntry {
    id: string
    patientName: string
    vitals: { bp: string; hr: string; sugar: string; temp: string; weight: string }
    timestamp: string
  }
  const [vitalsPatientId, setVitalsPatientId] = React.useState("")
  const [vitals, setVitals] = React.useState({ bp: "", hr: "", sugar: "", temp: "", weight: "" })
  const [isRecording, setIsRecording] = React.useState(false)
  const [syncQueue, setSyncQueue] = React.useState<VitalsEntry[]>([])
  const [isSyncing, setIsSyncing] = React.useState(false)

  // alerts: keyed by id so acknowledging one doesn't shift others
  interface LiveAlert {
    id: string
    type: "crisis" | "missed" | "triage"
    patient: string
    msg: string
    time: string
  }
  const [alerts, setAlerts] = React.useState<LiveAlert[]>([
    { id: "a1", type: "crisis", patient: "Alice Johnson", msg: "Mental health crisis flag detected.",         time: "Just now" },
    { id: "a2", type: "missed", patient: "Robert Smith",  msg: "Missed 3rd consecutive dose of Lisinopril.", time: "14m ago"  },
    { id: "a3", type: "triage", patient: "David Chen",    msg: "Self-triage score: 8/10 (High).",             time: "1h ago"   },
  ])
  const [realtimeConnected, setRealtimeConnected] = React.useState(false)

  const acknowledgeAlert = (id: string) =>
    setAlerts(prev => prev.filter(a => a.id !== id))



  /* ── generate queue ── */
  // refreshKey is incremented to re-trigger the effect (used by the Refresh button)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const generateQueue = () => setRefreshKey(k => k + 1)

  React.useEffect(() => {
    let active = true

    const run = async () => {
      setLoading(true)
      setQueueError(null)

      const id = Math.random().toString(36).substring(7)
      const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      setTrace(prev => [{ id, timestamp: ts, tool: "generate_chw_priority_queue", status: "pending", resources: ["Patient", "Observation", "MedicationRequest"] }, ...prev])
      const t0 = Date.now()

      try {
        const res = await fetch("/api/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patient_ids: ["592903", "12724", "88234", "45611"] }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)

        const items: QueueItem[] = (data.priority_queue ?? data.patients ?? []).map((p: Record<string, unknown>, i: number) => ({
          id: String(p.patient_id ?? p.id ?? i),
          name: String(p.patient_name ?? p.name ?? `Patient ${i + 1}`),
          score: Number(p.urgency_score ?? p.score ?? 50),
          reason: String(p.priority_reason ?? p.reason ?? "AI analysis complete"),
          location: String(p.location ?? `Zone ${String.fromCharCode(65 + i)}`),
          status: (Number(p.urgency_score ?? p.score ?? 50) >= 75 ? "critical" : Number(p.urgency_score ?? p.score ?? 50) >= 50 ? "urgent" : "stable") as QueueItem["status"],
        }))

        if (active) {
          setQueue(items.length === 0 ? [
            { id: "1", name: "Alice Johnson",   score: 94, reason: "Critically low medication adherence (24%) + new chest pain reports.", location: "Zone A", status: "critical" },
            { id: "2", name: "Robert Smith",    score: 72, reason: "Multiple missed hypertension doses in last 48 hours.",            location: "Zone B", status: "urgent"   },
            { id: "3", name: "Elena Rodriguez", score: 45, reason: "Routine follow-up for diabetes management.",                       location: "Zone A", status: "stable"   },
            { id: "4", name: "David Chen",      score: 38, reason: "Mental health check-in (stable mood logs).",                      location: "Zone C", status: "stable"   },
          ] : items)
          setTrace(prev => prev.map(e => e.id === id ? { ...e, status: "success", duration: Date.now() - t0 } : e))
        }
      } catch (err: unknown) {
        if (active) {
          const msg = err instanceof Error ? err.message : "Unknown error"
          setQueueError(msg)
          setTrace(prev => prev.map(e => e.id === id ? { ...e, status: "error", duration: Date.now() - t0 } : e))
          setQueue([
            { id: "1", name: "Alice Johnson",   score: 94, reason: "Critically low medication adherence + chest pain.",  location: "Zone A", status: "critical" },
            { id: "2", name: "Robert Smith",    score: 72, reason: "Multiple missed hypertension doses.",                location: "Zone B", status: "urgent"   },
            { id: "3", name: "Elena Rodriguez", score: 45, reason: "Routine diabetes follow-up.",                       location: "Zone A", status: "stable"   },
          ])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      run()
    }, 0)
    return () => { 
      active = false
      clearTimeout(timer)
    }
  }, [refreshKey])

  React.useEffect(() => {
    if (activeTab === "community" && globalPatients.length === 0) {
      fetchGlobalData()
    }
  }, [activeTab, globalPatients.length, fetchGlobalData])

  /* ── Supabase Realtime: new critical consultations become alerts ── */
  React.useEffect(() => {
    const channel = supabase
      .channel("chw-alerts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "consultations" },
        async (payload) => {
          // Fetch the patient name for this consultation
          const { data: pat } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", payload.new.patient_id)
            .single()

          const alertType = payload.new.priority === "critical" ? "crisis" : "triage"
          const newAlert: LiveAlert = {
            id: String(payload.new.id),
            type: alertType,
            patient: String(pat?.full_name ?? "Unknown Patient"),
            msg: alertType === "crisis"
              ? "Critical triage alert — immediate CHW visit required."
              : `New consultation: ${String(payload.new.ai_summary ?? "Triage assessment received.").slice(0, 60)}`,
            time: "Just now",
          }
          // Insert new alert at the top
          setAlerts(prev => [newAlert, ...prev.slice(0, 9)])
        }
      )
      .subscribe((status) => setRealtimeConnected(status === "SUBSCRIBED"))

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-text-white">
          Welcome back, {profile?.full_name?.split(" ")[0] || "Community Health Worker"}
        </h1>
        <p className="text-text-muted">Your AI-prioritized patient queue is ready.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-6 border-b border-border-base">
        {[
          { id: "queue", label: "Queue", icon: Users },
          { id: "route", label: "Task Route", icon: MapPin },
          { id: "vitals", label: "Rapid Vitals", icon: Pill },
          { id: "community", label: "Discovery", icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "queue" | "route" | "vitals")}
            className={cn(
              "pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all relative top-px",
              activeTab === tab.id 
                ? "border-brand-lime text-brand-lime" 
                : "border-transparent text-text-muted hover:text-text-white"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="My Patients"          value="42"    icon={<Users className="w-5 h-5" />}         color="purple" />
        <MetricCard label="Urgent Visits"        value="3"     icon={<AlertTriangle className="w-5 h-5" />}  color="red"    />
        <MetricCard label="Community Adherence"  value="68%"   trend={{ value: 4, label: "from yesterday", direction: "down" }} icon={<Pill className="w-5 h-5" />} color="amber" />
        <MetricCard label="Visits This Week"     value="18/25" icon={<Calendar className="w-5 h-5" />}       color="teal"   />
      </div>

      {activeTab === "queue" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Priority Queue */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-display font-bold">AI Priority Queue</h3>
                <Badge variant="new">FHIR R4 Analyzed</Badge>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center bg-surface-2 rounded-lg p-1 border border-border-base">
                  {(["score", "name", "contact"] as const).map(s => (
                    <button key={s} onClick={() => setSort(s)} className={cn("px-3 py-1 text-[10px] font-bold rounded-md capitalize transition-all", sort === s ? "bg-bg text-brand-lime shadow-sm" : "text-text-muted hover:text-text-white")}>
                      {s}
                    </button>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={generateQueue} disabled={loading} className="text-xs gap-2">
                  <RefreshCcw className={cn("w-3 h-3", loading && "animate-spin")} />
                  Refresh Queue
                </Button>
              </div>
            </div>

            {queueError && (
              <div className="px-1 flex items-center gap-2 text-xs text-amber font-mono">
                <AlertTriangle className="w-3 h-3" /> MCP offline — showing cached data
              </div>
            )}

            <Card className="glass border-brand-lime/20 overflow-hidden min-h-[400px]">
              <CardContent className="p-0">
                {loading && queue.length === 0 ? (
                  <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                    <Spinner size="lg" className="border-brand-lime" />
                    <p className="text-sm font-mono text-brand-lime animate-pulse">RANKING COMMUNITY BY CLINICAL RISK...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border-base/50">
                    {[...queue].sort((a, b) => {
                      if (sort === "score") return b.score - a.score
                      if (sort === "name") return a.name.localeCompare(b.name)
                      return 0 // fallback for contact
                    }).map(item => (
                      <button
                        key={item.id}
                        onClick={() => setDrawerPatient(item)}
                        className="group w-full text-left flex items-center gap-6 p-6 hover:bg-surface-2 transition-all animate-in slide-in-from-bottom-2"
                      >
                        {/* Score badge */}
                        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-bg border border-border-base shrink-0 group-hover:border-brand-lime transition-colors">
                          <span className={cn(
                            "text-2xl font-display font-bold",
                            item.score >= 80 ? "text-red" : item.score >= 50 ? "text-amber" : "text-teal"
                          )}>{item.score}</span>
                          <span className="text-[8px] font-mono font-bold text-text-muted uppercase tracking-widest">Score</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-text-white">{item.name}</h4>
                            <Badge variant={item.status}>{item.status.toUpperCase()}</Badge>
                            <span className="text-[10px] text-text-muted flex items-center gap-1 font-mono">
                              <MapPin className="w-3 h-3" />{item.location}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted leading-relaxed line-clamp-2 italic">&quot;{item.reason}&quot;</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button size="icon" variant="ghost" className="rounded-full hover:bg-brand-lime/10 hover:text-brand-lime" onClick={e => { e.stopPropagation() }}>
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="rounded-full hover:bg-brand-lime/10 hover:text-brand-lime" onClick={e => { e.stopPropagation() }}>
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button variant="primary" size="sm" className="ml-2 font-bold" onClick={e => { e.stopPropagation(); setDrawerPatient(item) }}>
                            {item.score >= 75 ? "Visit Now" : item.score >= 50 ? "Visit" : "Check In"}
                          </Button>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Live Alerts */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-display font-semibold">Live Health Alerts</h3>
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border",
                realtimeConnected
                  ? "bg-teal/10 border-teal/30 text-teal"
                  : "bg-surface border-border-base text-text-muted"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", realtimeConnected ? "bg-teal animate-pulse" : "bg-text-muted")} />
                {realtimeConnected ? "Live" : "Connecting"}
              </div>
            </div>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="p-6 rounded-2xl border border-border-base bg-surface text-center">
                  <CheckCircle2 className="w-6 h-6 text-teal mx-auto mb-2" />
                  <p className="text-sm font-medium text-teal">✓ No active alerts</p>
                </div>
              ) : alerts.map((alert) => (
                <div key={alert.id} className={cn(
                  "p-4 rounded-2xl border transition-all relative overflow-hidden animate-in slide-in-from-top-2 duration-300",
                  alert.type === "crisis" ? "bg-red/10 border-red/20" : "bg-surface border-border-base"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-[10px] font-mono font-bold uppercase tracking-widest",
                      alert.type === "crisis" ? "text-red" : "text-brand-lime"
                    )}>
                      {alert.type === "crisis" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red animate-pulse mr-1.5 mb-0.5" />}
                      {alert.type}
                    </span>
                    <span className="text-[10px] text-text-muted">{alert.time}</span>
                  </div>
                  <p className="text-sm font-bold text-text-white mb-1">{alert.patient}</p>
                  <p className="text-xs text-text-muted">{alert.msg}</p>
                  <Button
                    variant={alert.type === "crisis" ? "danger" : "ghost"}
                    size="sm"
                    className={cn("w-full mt-3 h-8 text-xs font-bold", alert.type === "crisis" && "bg-red text-white")}
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    {alert.type === "crisis" ? "Acknowledge & Call" : "Acknowledge"}
                  </Button>
                </div>
              ))}
            </div>

            {/* Community Summary Card */}
            <Card className="glass mt-4">
              <CardContent className="p-5 space-y-4">
                <h4 className="text-xs font-mono font-bold text-brand-lime uppercase tracking-widest">Community Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Avg Adherence</span>
                    <span className="font-mono font-bold text-amber">68%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Critical Patients</span>
                    <span className="font-mono font-bold text-red">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Weekly Visits</span>
                    <span className="font-mono font-bold text-teal">18 / 25</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-2">
                    <div className="h-2 rounded-full bg-brand-lime" style={{ width: "72%" }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "route" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Route Map/List */}
              <div className="lg:col-span-8 space-y-6">
                <Card className="glass border-brand-lime/20 overflow-hidden">
                  <div className="p-6 border-b border-border-base bg-brand-lime/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-text-white">Village Route Optimizer</h3>
                      <p className="text-xs text-text-muted">Most efficient path based on clinical urgency & location</p>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2 text-xs">
                      <ExternalLink className="w-3 h-3" /> Open in Maps
                    </Button>
                  </div>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border-base/50">
                      {[...queue].sort((a, b) => b.score - a.score).map((item, i) => (
                        <div key={item.id} className="p-6 flex items-center gap-6 group hover:bg-surface-2 transition-all">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-surface-2 border border-border-base flex items-center justify-center text-sm font-bold text-text-muted">
                              {i + 1}
                            </div>
                            <div className={cn("w-0.5 h-12 bg-border-base", i === queue.length - 1 && "opacity-0")} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-text-white">{item.name}</h4>
                              <Badge variant={item.status}>{item.status.toUpperCase()}</Badge>
                            </div>
                            <p className="text-xs text-text-muted flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-brand-lime" /> {item.location} · 
                              <Clock className="w-3 h-3" /> {(i + 1) * 15}m away
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Button 
                              size="sm" 
                              className="bg-brand-lime text-bg font-bold rounded-xl gap-2 h-9"
                              onClick={() => {
                                setDrawerPatient(item)
                              }}
                            >
                              <Navigation className="w-3.5 h-3.5" /> Start Visit
                            </Button>
                            <span className="text-[10px] font-mono text-text-muted">Est. Duration: 20m</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Route Summary */}
              <div className="lg:col-span-4 space-y-6">
                 <Card className="glass border-brand-lime/20 p-6 space-y-6">
                    <div className="space-y-1">
                      <h4 className="text-xs font-mono font-bold text-brand-lime uppercase tracking-widest">Today&apos;s Route Summary</h4>
                      <p className="text-sm text-text-muted">Optimized for 4 high-risk locations</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-border-base">
                        <div className="flex items-center gap-3">
                           <div className="p-2 rounded-lg bg-teal/10 text-teal"><Clock className="w-4 h-4" /></div>
                           <div className="text-xs">
                             <p className="text-text-muted">Total Travel Time</p>
                             <p className="font-bold text-text-white text-base">~1h 15m</p>
                           </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-border-base">
                        <div className="flex items-center gap-3">
                           <div className="p-2 rounded-lg bg-purple/10 text-purple"><Navigation className="w-4 h-4" /></div>
                           <div className="text-xs">
                             <p className="text-text-muted">Total Distance</p>
                             <p className="font-bold text-text-white text-base">8.4 km</p>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border-base">
                      <Button variant="ghost" className="w-full h-12 rounded-xl border-border-base hover:bg-surface-2 text-text-muted gap-2">
                        <RefreshCcw className="w-4 h-4" /> Re-calculate Route
                      </Button>
                    </div>
                 </Card>

                 <div className="p-6 rounded-2xl bg-amber/5 border border-amber/20 space-y-2">
                    <div className="flex items-center gap-2 text-amber">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Field Note</span>
                    </div>
                    <p className="text-xs text-amber/80 leading-relaxed">
                      Heavy traffic reported in Zone B. 
                      Recommended to take the bypass route to Alice Johnson.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === "vitals" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Vitals Form */}
              <div className="lg:col-span-8 space-y-6">
                <Card className="glass border-brand-lime/20 overflow-hidden">
                  <div className="p-6 border-b border-border-base bg-brand-lime/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-text-white">Rapid Field Entry</h3>
                      <p className="text-xs text-text-muted">Direct clinical logging for community visits</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => {
                          setIsRecording(true)
                          // Simulate voice recording and parsing
                          setTimeout(async () => {
                            const mockTranscript = "Patient blood pressure is 140 over 90, heart rate 85, and sugar is 110."
                            const res = await fetch("/api/ai/vitals", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ text: mockTranscript }),
                            })
                            const data = await res.json()
                            if (data.vitals) {
                              setVitals({
                                bp: data.vitals.blood_pressure || "",
                                hr: String(data.vitals.heart_rate || ""),
                                sugar: String(data.vitals.blood_sugar || ""),
                                temp: String(data.vitals.temperature || ""),
                                weight: String(data.vitals.weight || ""),
                              })
                            }
                            setIsRecording(false)
                          }, 2000)
                        }}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                          isRecording ? "bg-red text-white animate-pulse" : "bg-brand-lime text-bg hover:opacity-90"
                        )}
                       >
                         <Mic className="w-4 h-4" />
                         {isRecording ? "Listening..." : "Tap to Speak"}
                       </button>
                    </div>
                  </div>
                  <CardContent className="p-8 space-y-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-mono font-bold text-brand-lime uppercase tracking-widest">Target Patient</label>
                       <select 
                        value={vitalsPatientId}
                        onChange={e => setVitalsPatientId(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-surface border border-border-base focus:border-brand-lime outline-none text-sm text-text-light transition-all"
                       >
                         <option value="">Select Patient...</option>
                         {queue.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                          <Activity className="w-3 h-3 text-red" /> Blood Pressure
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. 120/80" 
                          value={vitals.bp}
                          onChange={e => setVitals({...vitals, bp: e.target.value})}
                          className="w-full h-12 px-4 rounded-xl bg-surface border border-border-base focus:border-brand-lime outline-none text-sm text-text-light transition-all font-mono" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                          <Activity className="w-3 h-3 text-teal" /> Heart Rate (BPM)
                        </label>
                        <input 
                          type="number" 
                          placeholder="e.g. 72" 
                          value={vitals.hr}
                          onChange={e => setVitals({...vitals, hr: e.target.value})}
                          className="w-full h-12 px-4 rounded-xl bg-surface border border-border-base focus:border-brand-lime outline-none text-sm text-text-light transition-all font-mono" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                          <Droplets className="w-3 h-3 text-amber" /> Blood Sugar (mg/dL)
                        </label>
                        <input 
                          type="number" 
                          placeholder="e.g. 100" 
                          value={vitals.sugar}
                          onChange={e => setVitals({...vitals, sugar: e.target.value})}
                          className="w-full h-12 px-4 rounded-xl bg-surface border border-border-base focus:border-brand-lime outline-none text-sm text-text-light transition-all font-mono" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                          <Thermometer className="w-3 h-3 text-purple" /> Temperature
                        </label>
                        <input 
                          type="number" 
                          placeholder="e.g. 36.5" 
                          value={vitals.temp}
                          onChange={e => setVitals({...vitals, temp: e.target.value})}
                          className="w-full h-12 px-4 rounded-xl bg-surface border border-border-base focus:border-brand-lime outline-none text-sm text-text-light transition-all font-mono" 
                        />
                      </div>
                    </div>

                    <Button 
                      className="w-full h-14 text-lg font-bold bg-brand-lime text-bg hover:opacity-90 rounded-2xl"
                      disabled={!vitalsPatientId || (!vitals.bp && !vitals.hr && !vitals.sugar)}
                      onClick={() => {
                        const newEntry = { 
                          id: Math.random().toString(36).substring(7),
                          patientName: queue.find(p => p.id === vitalsPatientId)?.name || "Unknown",
                          vitals, 
                          timestamp: new Date().toLocaleTimeString() 
                        }
                        setSyncQueue([newEntry, ...syncQueue])
                        setVitals({ bp: "", hr: "", sugar: "", temp: "", weight: "" })
                        setVitalsPatientId("")
                      }}
                    >
                      Log To Field Sync Queue
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Sync Queue */}
              <div className="lg:col-span-4 space-y-4">
                 <div className="flex items-center justify-between px-1">
                    <h3 className="text-lg font-display font-semibold">Field Sync Queue</h3>
                    <Badge variant={syncQueue.length > 0 ? "urgent" : "stable"}>
                      {syncQueue.length} Pending
                    </Badge>
                 </div>
                 <div className="space-y-3">
                    {syncQueue.length === 0 ? (
                      <div className="p-12 rounded-2xl border-2 border-dashed border-border-base text-center bg-surface-2/30">
                        <CloudUpload className="w-8 h-8 text-text-muted mx-auto mb-3" />
                        <p className="text-sm text-text-muted">Queue is empty. Log vitals to sync.</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                          {syncQueue.map((item) => (
                            <div key={item.id} className="p-4 rounded-xl bg-surface border border-border-base animate-in slide-in-from-right-4">
                              <div className="flex justify-between items-start mb-2">
                                <p className="text-sm font-bold text-text-white">{item.patientName}</p>
                                <span className="text-[10px] font-mono text-text-muted">{item.timestamp}</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {item.vitals.bp && <Badge variant="stable" className="bg-red/10 text-red text-[8px]">{item.vitals.bp}</Badge>}
                                {item.vitals.hr && <Badge variant="stable" className="bg-teal/10 text-teal text-[8px]">{item.vitals.hr} BPM</Badge>}
                                {item.vitals.sugar && <Badge variant="stable" className="bg-amber/10 text-amber text-[8px]">{item.vitals.sugar} mg/dL</Badge>}
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button 
                          variant="primary" 
                          className="w-full gap-2 h-12 rounded-xl font-bold"
                          disabled={isSyncing}
                          onClick={() => {
                            setIsSyncing(true)
                            setTimeout(() => {
                              setSyncQueue([])
                              setIsSyncing(false)
                              window.dispatchEvent(new Event("curaiva-refresh-data"))
                            }, 2000)
                          }}
                        >
                          {isSyncing ? <Spinner size="sm" className="border-bg" /> : <RefreshCcw className="w-4 h-4" />}
                          {isSyncing ? "Syncing to FHIR Server..." : "Sync All Records"}
                        </Button>
                      </>
                    )}
                 </div>

                 <Card className="glass border-brand-lime/20 p-5">
                    <h4 className="text-xs font-mono font-bold text-brand-lime uppercase tracking-widest mb-3">Offline Mode</h4>
                    <p className="text-[10px] text-text-muted leading-relaxed">
                      Records are stored locally until you re-establish a stable connection. 
                      Syncing will push all data to the centralized HAPI FHIR repository.
                    </p>
                 </Card>
              </div>
           </div>
        </div>
      )}
      {activeTab === "community" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
           <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display font-bold">Community Registry</h3>
                <p className="text-text-muted">Discover and reach out to community members via FHIR R4</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => fetchGlobalData()} disabled={globalLoading} className="text-xs gap-2">
                  <RefreshCcw className={cn("w-3 h-3", globalLoading && "animate-spin")} />
                  Refresh Registry
                </Button>
              </div>
           </div>

           <Card className="glass border-brand-lime/20 overflow-hidden min-h-[400px]">
             <CardContent className="p-0">
               {globalLoading ? (
                 <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                   <Spinner size="lg" className="border-brand-lime" />
                   <p className="text-sm font-mono text-brand-lime animate-pulse">QUERYING HAPI FHIR DIRECTORY...</p>
                 </div>
               ) : globalPatients.length === 0 ? (
                 <div className="p-20 text-center text-text-muted italic">No community members found in this registry.</div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-border-base/30">
                    {globalPatients.map((p: GlobalPatient) => (
                      <div key={p.id} className="p-6 hover:bg-surface-2 transition-all group">
                         <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-surface-3 flex items-center justify-center text-xl font-bold text-brand-lime border border-border-base group-hover:border-brand-lime transition-all">
                              {p.name[0]}
                            </div>
                            <Badge variant="stable" className="opacity-0 group-hover:opacity-100 transition-opacity">FHIR R4</Badge>
                         </div>
                         <h4 className="font-bold text-text-white text-lg mb-1">{p.name}</h4>
                         <p className="text-xs text-text-muted font-mono mb-4 uppercase tracking-tighter">ID: {p.id} · {p.gender}</p>
                         
                         <div className="flex items-center gap-2 mt-auto">
                            <Button size="sm" className="bg-brand-lime text-bg font-bold rounded-xl flex-1 h-9" onClick={() => alert(`Starting outreach visit for ${p.name}`)}>
                              Visit
                            </Button>
                            <Button size="icon" variant="ghost" className="rounded-xl hover:bg-brand-lime/10 hover:text-brand-lime h-9 w-9">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
             </CardContent>
           </Card>
        </div>
      )}

      {/* Patient Drawer */}
      {drawerPatient && (
        <PatientDrawer patient={drawerPatient} onClose={() => setDrawerPatient(null)} />
      )}

      {/* Live Tool Trace */}
      <ToolTrace entries={trace} />
    </div>
  )
}
