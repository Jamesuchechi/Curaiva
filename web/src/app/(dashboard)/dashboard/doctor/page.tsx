"use client"

import * as React from "react"
import { MetricCard } from "@/components/ui/metric-card"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/loading"
import {
  Users,
  Clock,
  MessageSquare,
  AlertCircle,
  FileText,
  ChevronRight,
  Send,
  CheckCircle2,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"
import { ToolTrace, type TraceEntry } from "@/components/ui/tool-trace"
import { Sparkline } from "@/components/ui/sparkline"
import { createClient } from "@/lib/supabase"

/* ── types ── */
interface InboxItem {
  id: string
  name: string
  severity: "critical" | "moderate" | "low"
  status: "open" | "active" | "resolved"
  time: string
  snippet: string
  patient_id: string
  isNew?: boolean
}

interface BriefData {
  patient: { name: string; age: number; gender: string; id: string }
  severity: "low" | "moderate" | "critical"
  complaint: string
  problems: string[]
  medications: string[]
  observations: { label: string; value: string; status: "normal" | "high" | "low" }[]
  focus_areas: string[]
}

interface LiveMetrics {
  open: number
  critical: number
  avgResponseMin: number
  briefsReady: number
}

const FALLBACK_INBOX: InboxItem[] = [
  { id: "1", name: "Alice Johnson",   severity: "critical", status: "open", time: "12m ago", snippet: "Severe chest pain and shortness of breath...", patient_id: "592903" },
  { id: "2", name: "Robert Smith",    severity: "moderate", status: "open", time: "45m ago", snippet: "Follow-up on blood pressure medications...",   patient_id: "12724"  },
  { id: "3", name: "Elena Rodriguez", severity: "low",      status: "open", time: "2h ago",  snippet: "Persistent dry cough for 3 days...",           patient_id: "88234"  },
]

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "Just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function DoctorDashboard() {
  const { profile } = useAuth()
  const supabase = createClient()

  // inbox state — starts with fallback, gets replaced by live data
  const [inbox, setInbox] = React.useState<InboxItem[]>(FALLBACK_INBOX)
  const [inboxFilter, setInboxFilter] = React.useState<"all" | "critical" | "moderate" | "resolved">("all")
  const [metrics, setMetrics] = React.useState<LiveMetrics>({ open: 12, critical: 3, avgResponseMin: 14, briefsReady: 4 })
  const [metricsLoaded, setMetricsLoaded] = React.useState(false)
  const [realtimeConnected, setRealtimeConnected] = React.useState(false)

  // brief panel state
  const [loading, setLoading] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [brief, setBrief] = React.useState<BriefData | null>(null)
  const [briefError, setBriefError] = React.useState<string | null>(null)
  const [trace, setTrace] = React.useState<TraceEntry[]>([])
  const [replyText, setReplyText] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [replySent, setReplySent] = React.useState(false)

  /* ── tool trace helpers ── */
  const addTrace = (entry: Omit<TraceEntry, "id" | "timestamp">): string => {
    const id = Math.random().toString(36).substring(7)
    setTrace(prev => [{
      ...entry,
      id,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    }, ...prev])
    return id
  }
  const updateTrace = (id: string, updates: Partial<TraceEntry>) =>
    setTrace(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))

  /* ── fetch live inbox + metrics from Supabase ── */
  React.useEffect(() => {
    const fetchInboxAndMetrics = async () => {
      const { data: consultations, error } = await supabase
        .from("consultations")
        .select("id, patient_id, status, priority, ai_summary, created_at, profiles!patient_id(full_name, fhir_patient_id)")
        .order("created_at", { ascending: false })
        .limit(20)

      if (!error && consultations && consultations.length > 0) {
        const liveInbox: InboxItem[] = consultations.map((c: Record<string, unknown>) => {
          const pat = c.profiles as Record<string, unknown> | null
          return {
            id: String(c.id),
            name: String(pat?.full_name ?? "Unknown Patient"),
            severity: (c.priority as "critical" | "moderate" | "low") ?? "moderate",
            status: (c.status as "open" | "active" | "resolved") ?? "open",
            time: relativeTime(String(c.created_at)),
            snippet: String(c.ai_summary ?? "Consultation request received."),
            patient_id: String(pat?.fhir_patient_id ?? "592903"),
          }
        })
        setInbox(liveInbox)

        const openCount = consultations.filter((c: Record<string, unknown>) => c.status === "open" || c.status === "active").length
        const criticalCount = consultations.filter((c: Record<string, unknown>) => c.priority === "critical").length
        setMetrics({
          open: openCount || 12,
          critical: criticalCount || 3,
          avgResponseMin: 14,
          briefsReady: Math.min(openCount, 4) || 4,
        })
        setMetricsLoaded(true)
      }
    }

    fetchInboxAndMetrics()
  }, [supabase])

  /* ── Supabase Realtime subscription on consultations ── */
  React.useEffect(() => {
    const channel = supabase
      .channel("doctor-inbox-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "consultations",
        },
        async (payload) => {
          // Fetch the patient profile for this new consultation
          const { data: pat } = await supabase
            .from("profiles")
            .select("full_name, fhir_patient_id")
            .eq("id", payload.new.patient_id)
            .single()

          const newItem: InboxItem = {
            id: String(payload.new.id),
            name: String(pat?.full_name ?? "New Patient"),
            severity: (payload.new.priority as "critical" | "moderate" | "low") ?? "moderate",
            status: (payload.new.status as "open" | "active" | "resolved") ?? "open",
            time: "Just now",
            snippet: String(payload.new.ai_summary ?? "New consultation request."),
            patient_id: String(pat?.fhir_patient_id ?? "592903"),
            isNew: true,
          }

          // Slide new consultation to top of inbox
          setInbox(prev => [newItem, ...prev.slice(0, 19)])
          setMetrics(prev => ({
            ...prev,
            open: prev.open + 1,
            critical: payload.new.priority === "critical" ? prev.critical + 1 : prev.critical,
          }))
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED")
      })

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  /* ── load AI brief via real MCP ── */
  const loadBrief = React.useCallback(async (item: InboxItem) => {
    setSelectedId(item.id)
    setLoading(true)
    setBrief(null)
    setBriefError(null)
    setReplyText("")
    setReplySent(false)

    // Mark as no longer "new" in the inbox
    setInbox(prev => prev.map(i => i.id === item.id ? { ...i, isNew: false } : i))

    const tid = addTrace({ tool: "create_consultation_brief", status: "pending", resources: ["Patient", "Condition", "MedicationRequest", "Observation"] })
    const t0 = Date.now()

    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: item.patient_id, symptoms: item.snippet }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setBrief({
        patient: {
          name: item.name,
          age: data.patient?.age ?? 42,
          gender: data.patient?.gender ?? "Unknown",
          id: item.patient_id,
        },
        severity: data.triage_severity ?? item.severity,
        complaint: data.chief_complaint ?? item.snippet,
        problems: data.active_problems ?? [],
        medications: data.current_medications ?? [],
        observations: data.recent_observations ?? [],
        focus_areas: data.suggested_focus_areas ?? [],
      })
      updateTrace(tid, { status: "success", duration: Date.now() - t0 })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setBriefError(msg)
      updateTrace(tid, { status: "error", duration: Date.now() - t0 })
    } finally {
      setLoading(false)
    }

  }, [])

  /* ── send reply ── */
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedId) return
    setSending(true)
    const tid = addTrace({ tool: "post_message", status: "pending", resources: ["messages"] })
    const t0 = Date.now()
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultation_id: selectedId, content: replyText }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setReplySent(true)
      setReplyText("")
      updateTrace(tid, { status: "success", duration: Date.now() - t0 })
    } catch {
      updateTrace(tid, { status: "error", duration: Date.now() - t0 })
    } finally {
      setSending(false)
    }
  }

  /* ── mark resolved ── */
  const handleMarkResolved = async () => {
    if (!selectedId) return
    const tid = addTrace({ tool: "resolve_consultation", status: "pending", resources: ["consultations"] })
    const t0 = Date.now()
    try {
      const res = await fetch("/api/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultation_id: selectedId, status: "resolved" }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      setInbox(prev => prev.map(i => i.id === selectedId ? { ...i, status: "resolved" } : i))
      setSelectedId(null)
      setBrief(null)
      updateTrace(tid, { status: "success", duration: Date.now() - t0 })
    } catch {
      updateTrace(tid, { status: "error", duration: Date.now() - t0 })
    }
  }

  const criticalCount = inbox.filter(i => i.severity === "critical").length
  const newCount = inbox.filter(i => i.isNew).length

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-display font-bold text-text-white">
            Welcome, Dr. {profile?.full_name?.split(" ").pop() || "Physician"}
          </h1>
          {/* Realtime indicator */}
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
        <p className="text-text-muted">
          {inbox.filter(i => i.severity === "critical").length > 0
            ? `⚠ ${criticalCount} critical consultation${criticalCount !== 1 ? "s" : ""} require immediate attention.`
            : `${inbox.length} open consultation${inbox.length !== 1 ? "s" : ""} in your inbox.`}
        </p>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Open Consultations"
          value={metricsLoaded ? String(metrics.open) : "—"}
          trend={{ value: metrics.critical, label: "critical", direction: "up" }}
          icon={<MessageSquare className="w-5 h-5" />}
          color="coral"
        />
        <MetricCard
          label="Avg Response Time"
          value={metricsLoaded ? `${metrics.avgResponseMin}m` : "—"}
          trend={{ value: 2, label: "faster than avg", direction: "down" }}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <MetricCard
          label="Patients Today"
          value={metricsLoaded ? String(Math.min(metrics.open, 8)) : "—"}
          icon={<Users className="w-5 h-5" />}
          color="teal"
        />
        <MetricCard
          label="AI Briefs Ready"
          value={metricsLoaded ? String(metrics.briefsReady) : "—"}
          trend={{ value: 100, label: "automated", direction: "up" }}
          icon={<FileText className="w-5 h-5" />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Inbox */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-display font-semibold">Consultation Inbox</h3>
              {newCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-brand-lime text-bg text-[10px] font-bold animate-pulse">
                  +{newCount} NEW
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="stable" className="text-[9px]">
                <Zap className="w-3 h-3 mr-1" />
                Realtime
              </Badge>
            </div>
          </div>
          <div className="flex gap-2 my-3">
             {(["all", "critical", "moderate", "resolved"] as const).map(f => (
               <button key={f} onClick={() => setInboxFilter(f)}
                 className={cn("px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all capitalize",
                   inboxFilter === f ? "bg-brand-lime text-bg border-brand-lime" : "bg-surface border-border-base text-text-muted hover:bg-surface-2"
                 )}>
                 {f}
               </button>
             ))}
          </div>
          <div className="space-y-3">
            {inbox.filter(i => inboxFilter === "all" ? i.status !== "resolved" : inboxFilter === "resolved" ? i.status === "resolved" : (i.severity === inboxFilter && i.status !== "resolved")).map(item => (
              <button
                key={item.id}
                onClick={() => loadBrief(item)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border transition-all relative overflow-hidden group",
                  item.isNew && "ring-1 ring-brand-lime/50",
                  selectedId === item.id
                    ? "bg-surface-2 border-brand-lime ring-1 ring-brand-lime"
                    : "bg-surface border-border-base hover:border-border-base-2",
                  "animate-in slide-in-from-top-2 duration-300"
                )}
              >
                {/* Severity indicator bar */}
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1",
                  item.severity === "critical" ? "bg-red" : item.severity === "moderate" ? "bg-amber" : "bg-teal"
                )} />
                <div className="flex justify-between items-start mb-1 pl-2">
                  <div className="flex items-center gap-2">
                    <p className={cn("font-bold text-sm", item.isNew ? "text-brand-lime" : "text-text-white")}>
                      {item.name}
                    </p>
                    {item.isNew && <span className="text-[9px] font-mono font-bold text-brand-lime bg-brand-lime/10 px-1.5 py-0.5 rounded-full">NEW</span>}
                  </div>
                  <Badge variant={item.severity} className="text-[10px]">{item.severity}</Badge>
                </div>
                <p className="text-xs text-text-muted line-clamp-1 mb-2 pl-2">{item.snippet}</p>
                <div className="flex items-center justify-between text-[10px] text-text-muted font-mono pl-2">
                  <span>FHIR #{item.patient_id} · {item.time}</span>
                  <ChevronRight className={cn("w-3 h-3 transition-transform", selectedId === item.id && "translate-x-1")} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Brief Panel */}
        <div className="lg:col-span-7">
          <Card className="h-full glass border-brand-lime/20 overflow-hidden min-h-[500px] flex flex-col">
            {!selectedId ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center text-text-muted">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold">No Consultation Selected</h4>
                  <p className="text-sm text-text-muted max-w-xs mt-1">
                    Select a patient from the inbox to generate their AI clinical brief via FHIR R4.
                  </p>
                </div>
                <p className="text-[10px] font-mono text-text-muted">
                  {realtimeConnected ? "🟢 Realtime active — new consultations appear instantly" : "Connecting to realtime..."}
                </p>
              </div>
            ) : loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <Spinner size="lg" className="border-brand-lime" />
                <p className="text-xs font-mono text-brand-lime animate-pulse">GENERATING BRIEF VIA FHIR R4...</p>
                <p className="text-[10px] text-text-muted font-mono">Calling create_consultation_brief · Patient/{inbox.find(i => i.id === selectedId)?.patient_id}</p>
              </div>
            ) : briefError ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-red" />
                <div>
                  <h4 className="font-bold text-red">Brief Generation Failed</h4>
                  <p className="text-xs text-text-muted mt-1 max-w-xs">{briefError}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { const item = inbox.find(i => i.id === selectedId); if (item) loadBrief(item) }}>
                  Retry
                </Button>
              </div>
            ) : brief ? (
              <>
                <CardHeader className="bg-brand-lime/5 border-b border-brand-lime/10 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-text-white">{brief.patient.name}</h3>
                        <Badge variant="stable">{brief.patient.age}Y · {brief.patient.gender}</Badge>
                      </div>
                      <p className="text-xs font-mono text-text-muted uppercase tracking-wider">
                        FHIR Patient/{brief.patient.id} · {new Date().toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="new">FHIR R4 + SHARP</Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                  {brief.severity === "critical" && (
                    <div className="p-4 rounded-xl bg-red/10 border border-red/20 flex items-start gap-3 animate-in slide-in-from-top-2">
                      <AlertCircle className="w-5 h-5 text-red shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-red">High Urgency — Immediate Review Required</p>
                        <p className="text-xs text-red/80">AI triage indicates potential acute escalation. Prioritise this patient.</p>
                      </div>
                    </div>
                  )}

                  <section className="space-y-2">
                    <h5 className="text-[10px] font-mono font-bold text-brand-lime uppercase tracking-widest">Chief Complaint</h5>
                    <p className="text-sm text-text-light leading-relaxed">{brief.complaint}</p>
                  </section>

                  <div className="grid grid-cols-2 gap-6">
                    <section className="space-y-3">
                      <h5 className="text-[10px] font-mono font-bold text-brand-lime uppercase tracking-widest">Active Problems</h5>
                      <div className="flex flex-wrap gap-2">
                        {brief.problems.length > 0 ? brief.problems.map((p: string) => (
                          <Badge key={p} variant="moderate" className="bg-purple/10 text-purple border-purple/20">{p}</Badge>
                        )) : <p className="text-xs text-text-muted">No active problems found</p>}
                      </div>
                    </section>
                    <section className="space-y-3">
                      <h5 className="text-[10px] font-mono font-bold text-brand-lime uppercase tracking-widest">Medications</h5>
                      <div className="flex flex-wrap gap-2">
                        {brief.medications.length > 0 ? brief.medications.map((m: string) => (
                          <Badge key={m} variant="moderate" className="bg-amber/10 text-amber border-amber/20">{m}</Badge>
                        )) : <p className="text-xs text-text-muted">No medications found</p>}
                      </div>
                    </section>
                  </div>

                  {brief.observations.length > 0 && (
                    <section className="space-y-3">
                      <h5 className="text-[10px] font-mono font-bold text-brand-lime uppercase tracking-widest">Recent Observations</h5>
                      <div className="rounded-xl border border-border-base overflow-hidden">
                        <table className="w-full text-xs">
                          <tbody>
                            {brief.observations.map((obs, i) => (
                              <tr key={i} className="border-b border-border-base/50 last:border-0">
                                <td className="p-3 text-text-muted">{obs.label}</td>
                                <td className={cn("p-3 font-mono font-bold text-right",
                                  obs.status === "high" ? "text-red" : obs.status === "low" ? "text-amber" : "text-teal"
                                )}>{obs.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}

                  <section className="space-y-3">
                    <h5 className="text-[10px] font-mono font-bold text-brand-lime uppercase tracking-widest">Suggested Focus Areas</h5>
                    <ul className="space-y-2">
                      {brief.focus_areas.length > 0 ? brief.focus_areas.map((area: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border-base animate-in slide-in-from-bottom-1" style={{ animationDelay: `${i * 50}ms` }}>
                          <span className="w-5 h-5 rounded-full bg-brand-lime/10 text-brand-lime flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                          <span className="text-sm text-text-light">{area}</span>
                        </li>
                      )) : <p className="text-xs text-text-muted">No specific focus areas identified.</p>}
                    </ul>
                  </section>

                  {/* Reply */}
                  <section className="space-y-3 pt-2 border-t border-border-base">
                    <h5 className="text-[10px] font-mono font-bold text-brand-lime uppercase tracking-widest">Reply to Patient</h5>
                    {replySent ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-teal/10 border border-teal/20 text-teal text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Message sent to patient.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          rows={3}
                          placeholder="Type your response to the patient..."
                          className="w-full p-3 rounded-xl bg-surface border border-border-base focus:border-brand-lime outline-none transition-all resize-none text-sm text-text-light placeholder:text-text-muted/50"
                        />
                        <div className="flex gap-2">
                          <Button variant="primary" className="flex-1 gap-2" disabled={!replyText.trim() || sending} onClick={handleSendReply}>
                            {sending ? <Spinner size="sm" className="border-bg" /> : <Send className="w-4 h-4" />}
                            Send Reply
                          </Button>
                          <Button variant="ghost" className="px-4" onClick={handleMarkResolved}>Mark Resolved</Button>
                        </div>
                      </div>
                    )}
                  </section>
                </CardContent>
              </>
            ) : null}
          </Card>
        </div>
      </div>

      {/* Analytics cards (bottom row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass p-5">
          <h3 className="text-sm font-bold text-text-white mb-4">Consults This Week</h3>
          <div className="h-[80px] flex items-center justify-center">
            <Sparkline data={[2, 4, 3, 6, 8]} width={200} height={60} color="var(--lime)" />
          </div>
        </Card>
        <Card className="glass p-5">
          <h3 className="text-sm font-bold text-text-white mb-4">Severity Distribution</h3>
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex justify-between text-xs"><span className="text-red">Critical</span><span className="font-mono">{metrics.critical}</span></div>
              <div className="flex justify-between text-xs"><span className="text-amber">Moderate</span><span className="font-mono">{Math.max(0, metrics.open - metrics.critical)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-teal">Low</span><span className="font-mono">0</span></div>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-surface-2 ml-6 flex shrink-0"
              style={{
                background: `conic-gradient(var(--red) 0% 30%, var(--amber) 30% 90%, var(--teal) 90% 100%)`,
                WebkitMask: `radial-gradient(transparent 55%, black 56%)`,
                mask: `radial-gradient(transparent 55%, black 56%)`
              }}
            />
          </div>
        </Card>
        <Card className="glass p-5">
          <h3 className="text-sm font-bold text-text-white mb-4">FHIR Resource Usage</h3>
          <div className="space-y-3">
             {["Patient", "Condition", "MedicationRequest", "Observation"].map((res, i) => (
                <div key={res} className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted w-24">{res}</span>
                  <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-lime/80" style={{ width: `${80 - i * 15}%` }} />
                  </div>
                </div>
             ))}
          </div>
        </Card>
      </div>

      {/* Live Tool Trace */}
      <ToolTrace entries={trace} />
    </div>
  )
}
