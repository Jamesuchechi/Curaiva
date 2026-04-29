"use client"

import * as React from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/loading"
import { Send, CheckCircle2, Clock, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const MOCK_CONSULTATIONS = [
  { id: "c1", doctor: "Dr. Amara Osei",    status: "active",   date: "Apr 27, 12:31", snippet: "Your blood pressure reading requires attention. Please consider...", severity: "moderate" as const },
  { id: "c2", doctor: "Dr. James Fowler",   status: "resolved", date: "Apr 23, 09:00", snippet: "Follow-up complete. Continue current medication regimen.", severity: "low" as const },
  { id: "c3", doctor: "Dr. Sarah Williams", status: "open",     date: "Apr 20, 14:45", snippet: "Awaiting physician review of your triage assessment.", severity: "low" as const },
]

export default function ConsultationsPage() {
  const { profile } = useAuth()
  const [selected, setSelected] = React.useState(MOCK_CONSULTATIONS[0])
  const [reply, setReply] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const [starting, setStarting] = React.useState(false)
  const [consultations, setConsultations] = React.useState(MOCK_CONSULTATIONS)

  const sendMessage = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultation_id: selected.id, content: reply }),
      })
      setSent(true)
      setReply("")
    } finally {
      setSending(false)
    }
  }

  const startConsultation = async () => {
    setStarting(true)
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_summary: "New consultation request from patient dashboard." }),
      })
      const data = await res.json()
      if (!data.error) {
        const newC = {
          id: data.id ?? `c${Date.now()}`,
          doctor: "Awaiting assignment",
          status: "open" as const,
          date: new Date().toLocaleString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
          snippet: "Consultation request submitted. A doctor will respond shortly.",
          severity: "low" as const,
        }
        setConsultations(prev => [newC, ...prev])
        setSelected(newC)
      }
    } finally {
      setStarting(false)
    }
  }

  const statusColor = (s: string) =>
    s === "active" ? "text-brand-lime border-brand-lime/30 bg-brand-lime/10"
    : s === "open" ? "text-amber border-amber/30 bg-amber/10"
    : "text-text-muted border-border-base bg-surface-2"

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-white">Consultations</h1>
          <p className="text-text-muted mt-1">Message your care team and review consultation history</p>
        </div>
        <Button onClick={startConsultation} disabled={starting} className="gap-2">
          {starting ? <Spinner size="sm" className="border-bg" /> : <Plus className="w-4 h-4" />}
          New Consultation
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List */}
        <div className="lg:col-span-4 space-y-3">
          {consultations.map(c => (
            <button key={c.id} onClick={() => { setSelected(c); setSent(false) }}
              className={cn(
                "w-full text-left p-4 rounded-2xl border transition-all",
                selected?.id === c.id ? "bg-surface-2 border-brand-lime ring-1 ring-brand-lime" : "bg-surface border-border-base hover:border-border-base-2"
              )}>
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-sm text-text-white truncate">{c.doctor}</p>
                <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border", statusColor(c.status))}>
                  {c.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-text-muted line-clamp-2">{c.snippet}</p>
              <p className="text-[10px] font-mono text-text-muted mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {c.date}
              </p>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-8">
          <Card className="glass border-brand-lime/20 min-h-[400px] flex flex-col">
            <CardHeader className="border-b border-border-base p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-text-white">{selected.doctor}</p>
                  <p className="text-xs text-text-muted">{selected.date}</p>
                </div>
                <Badge variant={selected.severity}>{selected.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-5 space-y-4">
              {/* Message thread */}
              <div className="flex-1 space-y-3">
                <div className="p-3 rounded-xl bg-surface border border-border-base max-w-[85%]">
                  <p className="text-xs font-bold text-brand-lime mb-1">{selected.doctor}</p>
                  <p className="text-sm text-text-light">{selected.snippet}</p>
                </div>
              </div>

              {/* Reply */}
              {selected.status !== "resolved" && (
                <div className="space-y-2 border-t border-border-base pt-4">
                  {sent ? (
                    <div className="flex items-center gap-2 text-sm text-teal font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Message sent to your care team.
                    </div>
                  ) : (
                    <>
                      <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3}
                        placeholder="Type your message..."
                        className="w-full p-3 rounded-xl bg-surface border border-border-base focus:border-brand-lime outline-none resize-none text-sm text-text-light placeholder:text-text-muted/50 transition-all"
                      />
                      <Button onClick={sendMessage} disabled={!reply.trim() || sending} className="gap-2">
                        {sending ? <Spinner size="sm" className="border-bg" /> : <Send className="w-4 h-4" />}
                        Send
                      </Button>
                    </>
                  )}
                </div>
              )}

              {selected.status === "resolved" && (
                <div className="flex items-center gap-2 text-sm text-text-muted border-t border-border-base pt-4">
                  <CheckCircle2 className="w-4 h-4 text-teal" /> This consultation is resolved.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-[10px] font-mono text-text-muted text-center">
        FHIR ID: {profile?.fhir_patient_id ?? "592903"} · Consultations stored in Supabase · Realtime messages via MCP
      </p>
    </div>
  )
}
