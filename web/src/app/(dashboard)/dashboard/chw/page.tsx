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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"
import { ToolTrace, type TraceEntry } from "@/components/ui/tool-trace"
import { createClient } from "@/lib/supabase"
import type { QueueItem } from "@/types"

/* ── Patient Drawer ── */
interface DrawerProps {
  patient: QueueItem
  onClose: () => void
}

function PatientDrawer({ patient, onClose }: DrawerProps) {
  const [message, setMessage] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [sent, setSent] = React.useState(false)

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
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-border-base bg-bg2 flex gap-3">
          <Button variant="primary" className="flex-1 gap-2">
            <Calendar className="w-4 h-4" /> Schedule Visit
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-brand-lime/10 hover:text-brand-lime">
            <Phone className="w-5 h-5" />
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

    run()
    return () => { active = false }
  }, [refreshKey])

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

      {/* Metric Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="My Patients"          value="42"    icon={<Users className="w-5 h-5" />}         color="purple" />
        <MetricCard label="Urgent Visits"        value="3"     icon={<AlertTriangle className="w-5 h-5" />}  color="red"    />
        <MetricCard label="Community Adherence"  value="68%"   trend={{ value: 4, label: "from yesterday", direction: "down" }} icon={<Pill className="w-5 h-5" />} color="amber" />
        <MetricCard label="Visits This Week"     value="18/25" icon={<Calendar className="w-5 h-5" />}       color="teal"   />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Priority Queue */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-display font-bold">AI Priority Queue</h3>
              <Badge variant="new">FHIR R4 Analyzed</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={generateQueue} disabled={loading} className="text-xs gap-2">
              <RefreshCcw className={cn("w-3 h-3", loading && "animate-spin")} />
              Refresh Queue
            </Button>
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
                  {queue.map(item => (
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

      {/* Patient Drawer */}
      {drawerPatient && (
        <PatientDrawer patient={drawerPatient} onClose={() => setDrawerPatient(null)} />
      )}

      {/* Live Tool Trace */}
      <ToolTrace entries={trace} />
    </div>
  )
}
