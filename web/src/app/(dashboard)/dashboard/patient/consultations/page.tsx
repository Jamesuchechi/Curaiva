"use client"

import * as React from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { useAIPanel } from "@/components/providers/ai-panel-provider"
import { useConsultationsData } from "@/hooks/use-consultations-data"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner, Skeleton } from "@/components/ui/loading"
import { Send, CheckCircle2, Clock, Plus, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { DoctorSelectionModal } from "@/components/ui/doctor-selection-modal"

export default function ConsultationsPage() {
  const { profile } = useAuth()
  const { setPageContext, open } = useAIPanel()
  
  const { 
    consultations, 
    loadingList, 
    error, 
    refetch,
    activeThreadId,
    setActiveThreadId,
    messages,
    loadingThread,
    supabase 
  } = useConsultationsData(profile?.id)

  const [reply, setReply] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [starting, setStarting] = React.useState(false)
  const [showDoctorModal, setShowDoctorModal] = React.useState(false)

  // Inject context to AI Panel
  React.useEffect(() => {
    if (consultations.length > 0) {
      setPageContext({
        openConsultations: consultations.filter(c => c.status !== "resolved").length,
        recentConsultationSummary: consultations[0]?.snippet,
        recentConsultationStatus: consultations[0]?.status
      })
    }
  }, [consultations, setPageContext])

  const sendMessage = async () => {
    if (!reply.trim() || !activeThreadId || !profile?.id) return
    setSending(true)
    try {
      await supabase.from("messages").insert({
        consultation_id: activeThreadId,
        sender_id: profile.id,
        content: reply
      })
      setReply("")
      // The realtime subscription will automatically add this to the list
    } finally {
      setSending(false)
    }
  }

  const startConsultation = async (doctorId: string) => {
    if (!profile?.id) return
    setStarting(true)
    setShowDoctorModal(false)
    try {
      const { data, error } = await supabase.from("consultations").insert({
        patient_id: profile.id,
        doctor_id: doctorId,
        status: "open",
        severity: "low",
        ai_summary: "New consultation request from patient dashboard."
      }).select("id").single()

      if (!error && data) {
        // Optimistically reload the list and select the new one
        refetch()
        setActiveThreadId(data.id)
      }
    } finally {
      setStarting(false)
    }
  }

  const statusColor = (s: string) =>
    s === "active" ? "text-brand-lime border-brand-lime/30 bg-brand-lime/10"
    : s === "open" ? "text-amber border-amber/30 bg-amber/10"
    : "text-text-muted border-border-base bg-surface-2"

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red/10 border border-red/20 text-red flex items-center justify-between">
        <div>
          <h3 className="font-bold">Failed to load consultations</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>Try Again</Button>
      </div>
    )
  }

  if (loadingList && consultations.length === 0) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex items-center justify-between">
          <Skeleton className="h-16 w-64 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
          </div>
          <div className="lg:col-span-8">
            <Skeleton className="h-[500px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  const activeConsultation = consultations.find(c => c.id === activeThreadId)

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-white">Consultations</h1>
          <p className="text-text-muted mt-1">Message your care team and review consultation history</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => open("Can you summarize my recent consultations?")} className="gap-2 border border-purple/20 bg-transparent text-purple hover:bg-purple/10">
            <Sparkles className="w-4 h-4" /> Ask AI
          </Button>
          <Button onClick={() => setShowDoctorModal(true)} disabled={starting} className="gap-2 bg-brand-lime text-bg hover:opacity-90">
            {starting ? <Spinner size="sm" className="border-bg" /> : <Plus className="w-4 h-4" />}
            New Consultation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List */}
        <div className="lg:col-span-4 space-y-3">
          {consultations.length === 0 ? (
            <div className="p-8 rounded-3xl border border-dashed border-border-base bg-surface/50 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-lime/10 flex items-center justify-center mx-auto">
                <Plus className="w-6 h-6 text-brand-lime" />
              </div>
              <div>
                <p className="font-bold text-text-white">No Consultations</p>
                <p className="text-xs text-text-muted mt-1">Start a new session with a specialist to get medical advice.</p>
              </div>
              <Button onClick={() => setShowDoctorModal(true)} variant="secondary" className="w-full bg-brand-lime/10 border-brand-lime/20 text-brand-lime hover:bg-brand-lime/20">
                Find a Doctor
              </Button>
            </div>
          ) : (
            consultations.map(c => (
              <button key={c.id} onClick={() => setActiveThreadId(c.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border transition-all",
                  activeThreadId === c.id ? "bg-surface-2 border-brand-lime ring-1 ring-brand-lime" : "bg-surface border-border-base hover:border-border-base-2"
                )}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-sm text-text-white truncate">{c.doctor_name}</p>
                  <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border", statusColor(c.status))}>
                    {c.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-text-muted line-clamp-2">{c.snippet}</p>
                <p className="text-[10px] font-mono text-text-muted mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(c.created_at).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-8">
          {activeConsultation ? (
            <Card className="glass border-brand-lime/20 min-h-[500px] flex flex-col relative overflow-hidden">
              <CardHeader className="border-b border-border-base p-5 bg-surface-2/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-text-white">{activeConsultation.doctor_name}</p>
                    <p className="text-xs text-text-muted">Started: {new Date(activeConsultation.created_at).toLocaleString()}</p>
                  </div>
                  <Badge variant={activeConsultation.severity === "high" ? "urgent" : (activeConsultation.severity as "low" | "moderate" | "critical")}>{activeConsultation.status}</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0 h-[400px]">
                {/* Message thread */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="p-4 rounded-xl bg-surface-2 border border-border-base w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-brand-lime" />
                      <p className="text-xs font-bold text-brand-lime uppercase tracking-wider">AI Summary / Triage Notes</p>
                    </div>
                    <p className="text-sm text-text-light">{activeConsultation.snippet}</p>
                  </div>

                  {loadingThread ? (
                    <div className="flex justify-center py-4"><Spinner size="sm" /></div>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-text-muted text-center py-4">No messages yet.</p>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.sender_id === profile?.id
                      return (
                        <div key={msg.id} className={cn(
                          "max-w-[85%] rounded-2xl p-4 text-sm animate-in fade-in slide-in-from-bottom-2",
                          isMe ? "bg-surface-2 border border-border-base text-text-white ml-auto rounded-tr-sm" : "bg-brand-lime/10 border border-brand-lime/20 text-text-light mr-auto rounded-tl-sm"
                        )}>
                          {!isMe && <p className="text-[10px] font-bold text-brand-lime uppercase mb-1">{activeConsultation.doctor_name}</p>}
                          {msg.content}
                          <p className="text-[9px] text-text-muted/50 mt-2 text-right">
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Reply Box */}
                {activeConsultation.status !== "resolved" ? (
                  <div className="p-4 border-t border-border-base bg-surface">
                    <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="relative flex gap-2">
                      <input 
                        type="text" 
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 h-12 pl-4 pr-4 rounded-xl bg-surface-2 border border-border-base focus:border-brand-lime outline-none text-sm transition-all"
                      />
                      <Button type="submit" disabled={!reply.trim() || sending} size="icon" className="h-12 w-12 bg-brand-lime text-bg hover:opacity-90 shrink-0 rounded-xl">
                        {sending ? <Spinner size="sm" className="border-bg" /> : <Send className="w-5 h-5" />}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="p-4 border-t border-border-base bg-surface-2/50 flex items-center justify-center gap-2 text-sm text-text-muted">
                    <CheckCircle2 className="w-4 h-4 text-teal" /> This consultation has been resolved by the care team.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-[500px] flex items-center justify-center border border-dashed border-border-base rounded-3xl">
              <p className="text-text-muted text-sm">Select a consultation to view details</p>
            </div>
          )}
        </div>
      </div>

      <DoctorSelectionModal
        isOpen={showDoctorModal}
        onClose={() => setShowDoctorModal(false)}
        onSelect={startConsultation}
        patientKeywords={["heart", "blood pressure", "hypertension"]}
      />

      <p className="text-[10px] font-mono text-text-muted text-center mt-8">
        FHIR ID: {profile?.fhir_patient_id ?? "592903"} · Consultations stored in Supabase · Realtime messages enabled
      </p>
    </div>
  )
}
