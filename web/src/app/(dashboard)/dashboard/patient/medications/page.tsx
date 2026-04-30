"use client"

import * as React from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { useAIPanel } from "@/components/providers/ai-panel-provider"
import { useMedicationsData } from "@/hooks/use-medications-data"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner, Skeleton } from "@/components/ui/loading"
import { Pill, CheckCircle2, Clock, RefreshCcw, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

export default function MedicationsPage() {
  const { profile } = useAuth()
  const { setPageContext } = useAIPanel()
  const { meds, loading, error, refetch, supabase } = useMedicationsData(profile?.id)
  
  const [logging, setLogging] = React.useState<string | null>(null)
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [addingMed, setAddingMed] = React.useState(false)
  const [newMed, setNewMed] = React.useState({ name: "", dose: "", schedule: "" })

  // Inject context to AI Panel when meds change
  React.useEffect(() => {
    if (meds.length > 0) {
      setPageContext({
        activeMedications: meds.map(m => ({
          name: m.name, dose: m.dose, time: m.time, status: m.status
        })),
        avgAdherence: Math.round(meds.reduce((a, m) => a + m.adherence, 0) / meds.length) || 100,
        unloggedMeds: meds.filter(m => m.status !== "taken").map(m => m.name)
      })
    }
  }, [meds, setPageContext])

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMed.name || !newMed.dose || !newMed.schedule || !profile?.id) return
    
    setAddingMed(true)
    try {
      await supabase.from("medications").insert({
        patient_id: profile.id,
        name: newMed.name,
        dosage: newMed.dose,
        frequency: "daily",
        times: [newMed.schedule],
        active: true
      })
      refetch()
      setShowAddModal(false)
      setNewMed({ name: "", dose: "", schedule: "" })
    } finally {
      setAddingMed(false)
    }
  }

  const logDose = async (id: string) => {
    setLogging(id)
    try {
      await fetch("/api/medications/log", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medication_id: id, status: "taken" }),
      })
      refetch()
    } finally {
      setLogging(null)
    }
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red/10 border border-red/20 text-red flex items-center justify-between">
        <div>
          <h3 className="font-bold">Failed to load medications</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>Try Again</Button>
      </div>
    )
  }

  if (loading && meds.length === 0) {
    return (
      <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 pb-20">
        <div className="flex-1 space-y-8">
          <Skeleton className="h-20 w-64 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
        <div className="lg:w-80 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  const takenCount = meds.filter(m => m.status === "taken").length
  const adherencePct = meds.length > 0 ? Math.round(meds.reduce((a, m) => a + m.adherence, 0) / meds.length) : 100

  // Calculate streak based on overall history across all meds
  let streak = 0
  if (meds.length > 0 && meds[0].history) {
    const days = meds[0].history.length
    for (let i = days - 1; i >= 0; i--) {
      // If at least one med was taken this day (or there were no meds to take, but we'll simplify)
      const dayTaken = meds.some(m => m.history[i]?.taken)
      if (dayTaken) streak++
      else break
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 pb-20">
      <div className="flex-1 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-white">Medications</h1>
          <p className="text-text-muted mt-1">Pharmacy Orchestration · Interoperable FHIR Adherence</p>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Today's Doses", value: `${takenCount}/${meds.length}`, color: "text-brand-lime", icon: <Pill className="w-4 h-4" /> },
            { label: "Avg Adherence", value: `${adherencePct}%`, color: adherencePct >= 80 ? "text-teal" : "text-amber", icon: <RefreshCcw className="w-4 h-4" /> },
            { label: "Active Streak", value: `${streak} days 🔥`, color: "text-amber", icon: <CheckCircle2 className="w-4 h-4" /> },
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

        {/* Today's list */}
        <Card className="glass border-brand-lime/20">
          <CardHeader className="pb-4 border-b border-border-base bg-surface-2/30 flex flex-row items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-semibold">Today&apos;s Schedule</h2>
              <p className="text-xs text-text-muted">Prescription synchronization active</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-brand-lime hover:bg-brand-lime/10" onClick={() => setShowAddModal(true)}>
              <Plus className="w-3 h-3 mr-1" /> Add Medication
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {meds.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">No active medications found.</p>
            ) : (
              meds.map(med => (
                <div key={`${med.id}-${med.time}`} className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                  med.status === "taken" ? "bg-teal/5 border-teal/20" : "bg-surface border-border-base"
                )}>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    med.status === "taken" ? "bg-teal/20 text-teal" : "bg-surface-2 text-text-muted"
                  )}>
                    {med.status === "taken" ? <CheckCircle2 className="w-5 h-5" /> : <Pill className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-text-white">{med.name}</p>
                      <Badge variant="stable" className="text-[10px] bg-brand-lime/10 text-brand-lime border-brand-lime/20">{med.dose}</Badge>
                    </div>
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {med.time} · {med.adherence}% adherence
                    </p>
                  </div>
                  {med.status !== "taken" ? (
                    <Button size="sm" onClick={() => logDose(med.id)} disabled={logging === med.id}
                      className="text-xs font-bold h-9 px-4 bg-brand-lime text-bg hover:opacity-90 transition-all">
                      {logging === med.id ? <Spinner size="sm" className="border-bg" /> : "Log Dose"}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-teal px-3 py-1 rounded-full bg-teal/10 border border-teal/20">
                      <CheckCircle2 className="w-3 h-3" /> Taken
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 7-day history grid */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <h2 className="text-lg font-display font-semibold">7-Day Adherence History</h2>
          </CardHeader>
          <CardContent>
            {meds.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">No historical data.</p>
            ) : (
              <div className="space-y-6">
                {meds.map(med => (
                  <div key={`${med.id}-history`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-light">{med.name}</span>
                        <span className="text-[10px] text-text-muted font-mono">{med.dose}</span>
                      </div>
                      <span className={cn("text-xs font-mono font-bold", med.adherence >= 80 ? "text-teal" : "text-amber")}>{med.adherence}% Score</span>
                    </div>
                    <div className="flex gap-2">
                      {med.history.map((day) => (
                        <div key={day.dayStr} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className={cn("w-full h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all",
                            day.taken ? "bg-teal/20 border-teal/30 text-teal shadow-sm" : "bg-bg/30 border-border-base text-text-muted"
                          )}>
                            {day.taken ? "✓" : "✗"}
                          </div>
                          <span className="text-[10px] font-mono font-bold text-text-muted">{day.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-[10px] font-mono text-text-muted text-center">
          FHIR ID: {profile?.fhir_patient_id ?? "592903"} · MedicationRequest R4 · Adherence via check_medication_adherence MCP
        </p>
      </div>

      {/* Pharmacy sidebar */}
      <div className="lg:w-80 space-y-6">
        <Card className="glass border-brand-lime/20 overflow-hidden">
          <div className="bg-brand-lime/10 p-4 border-b border-brand-lime/20">
            <h3 className="text-xs font-bold text-brand-lime uppercase tracking-widest flex items-center gap-2">
              <Plus className="w-3 h-3" /> Pharmacy Overview
            </h3>
          </div>
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="text-[10px] text-text-muted font-mono uppercase">Assigned Pharmacist</p>
              <p className="text-sm font-bold text-text-white">Dr. James Okoro</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted font-mono uppercase">Preferred Pharmacy</p>
              <p className="text-sm font-bold text-text-white">Curaiva Central Health</p>
            </div>
            <div className="pt-2 border-t border-border-base">
              <p className="text-[10px] text-text-muted font-mono uppercase mb-2">Prescription Status</p>
              <div className="space-y-3">
                {meds.slice(0, 3).map(m => (
                  <div key={`status-${m.id}`} className="flex items-center justify-between">
                    <span className="text-xs text-text-light">{m.name}</span>
                    <Badge className="bg-teal/20 text-teal text-[9px] border-none">Active</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-teal/20">
          <div className="bg-teal/10 p-4 border-b border-teal/20">
            <h3 className="text-xs font-bold text-teal uppercase tracking-widest flex items-center gap-2">
              <RefreshCcw className="w-3 h-3" /> Adherence Analysis
            </h3>
          </div>
          <CardContent className="p-4">
            <p className="text-xs text-text-muted leading-relaxed">
              Your adherence score is calculated based on log consistency against prescribed FHIR schedules. High scores reduce clinical complication risks.
            </p>
            <Button variant="ghost" className="w-full mt-4 text-xs font-bold text-teal hover:bg-teal/10">
              Download Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-md bg-surface border border-border-base rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border-base bg-surface-2 flex items-center justify-between">
              <h3 className="font-bold text-lg">Add New Medication</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <form onSubmit={handleAddMedication} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Medication Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Lisinopril"
                  className="w-full h-11 px-4 rounded-xl bg-surface-2 border border-border-base focus:border-brand-lime outline-none text-sm transition-all shadow-inner"
                  value={newMed.name}
                  onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Dose</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., 10mg"
                    className="w-full h-11 px-4 rounded-xl bg-surface-2 border border-border-base focus:border-brand-lime outline-none text-sm transition-all shadow-inner"
                    value={newMed.dose}
                    onChange={e => setNewMed({ ...newMed, dose: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Schedule</label>
                  <input 
                    type="time" 
                    required
                    className="w-full h-11 px-4 rounded-xl bg-surface-2 border border-border-base focus:border-brand-lime outline-none text-sm transition-all shadow-inner"
                    value={newMed.schedule}
                    onChange={e => setNewMed({ ...newMed, schedule: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-border-base mt-6">
                <Button type="submit" disabled={addingMed} className="w-full h-12 font-bold bg-brand-lime text-bg hover:opacity-90 shadow-lg">
                  {addingMed ? <Spinner size="sm" className="border-bg" /> : "Save Medication"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
