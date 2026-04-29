"use client"

import * as React from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pill, CheckCircle2, Clock, RefreshCcw, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

const MOCK_MEDICATIONS = [
  { id: "m1", name: "Lisinopril",   dose: "10mg",  schedule: "08:00", taken: true,  adherence: 92 },
  { id: "m2", name: "Metformin",    dose: "500mg", schedule: "13:00", taken: false, adherence: 68 },
  { id: "m3", name: "Atorvastatin", dose: "20mg",  schedule: "20:00", taken: false, adherence: 85 },
  { id: "m4", name: "Amlodipine",   dose: "5mg",   schedule: "08:00", taken: true,  adherence: 97 },
]

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export default function MedicationsPage() {
  const { profile } = useAuth()
  const [meds, setMeds] = React.useState(MOCK_MEDICATIONS)
  const [logging, setLogging] = React.useState<string | null>(null)
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [newMed, setNewMed] = React.useState({ name: "", dose: "", schedule: "" })

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMed.name || !newMed.dose || !newMed.schedule) return
    const nextId = `m${meds.length + 1}`
    setMeds(prev => [...prev, { id: nextId, name: newMed.name, dose: newMed.dose, schedule: newMed.schedule, taken: false, adherence: 100 }])
    setShowAddModal(false)
    setNewMed({ name: "", dose: "", schedule: "" })
  }

  const logDose = async (id: string) => {
    setLogging(id)
    try {
      await fetch("/api/medications/log", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medication_id: id, status: "taken" }),
      })
      setMeds(prev => prev.map(m => m.id === id ? { ...m, taken: true } : m))
    } finally {
      setLogging(null)
    }
  }

  const takenCount = meds.filter(m => m.taken).length
  const adherencePct = Math.round(meds.reduce((a, m) => a + m.adherence, 0) / meds.length)

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
            { label: "Active Streak", value: "6 days 🔥", color: "text-amber", icon: <CheckCircle2 className="w-4 h-4" /> },
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
            {meds.map(med => (
              <div key={med.id} className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                med.taken ? "bg-teal/5 border-teal/20" : "bg-surface border-border-base"
              )}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                  med.taken ? "bg-teal/20 text-teal" : "bg-surface-2 text-text-muted"
                )}>
                  {med.taken ? <CheckCircle2 className="w-5 h-5" /> : <Pill className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-text-white">{med.name}</p>
                    <Badge variant="stable" className="text-[10px] bg-brand-lime/10 text-brand-lime border-brand-lime/20">{med.dose}</Badge>
                  </div>
                  <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {med.schedule} · {med.adherence}% adherence
                  </p>
                </div>
                {!med.taken ? (
                  <Button size="sm" onClick={() => logDose(med.id)} disabled={logging === med.id}
                    className="text-xs font-bold h-9 px-4 bg-brand-lime text-bg hover:opacity-90 transition-all">
                    {logging === med.id ? "Logging…" : "Log Dose"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-teal px-3 py-1 rounded-full bg-teal/10 border border-teal/20">
                    <CheckCircle2 className="w-3 h-3" /> Taken
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 7-day history grid */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <h2 className="text-lg font-display font-semibold">7-Day Adherence History</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {meds.map(med => (
                <div key={med.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-light">{med.name}</span>
                      <span className="text-[10px] text-text-muted font-mono">{med.dose}</span>
                    </div>
                    <span className={cn("text-xs font-mono font-bold", med.adherence >= 80 ? "text-teal" : "text-amber")}>{med.adherence}% Score</span>
                  </div>
                  <div className="flex gap-2">
                    {DAYS.map((day) => {
                      const taken = Math.random() > (1 - med.adherence / 100)
                      return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className={cn("w-full h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all",
                            taken ? "bg-teal/20 border-teal/30 text-teal shadow-sm" : "bg-bg/30 border-border-base text-text-muted"
                          )}>
                            {taken ? "✓" : "✗"}
                          </div>
                          <span className="text-[10px] font-mono font-bold text-text-muted">{day[0]}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
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
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-light">Lisinopril</span>
                  <Badge className="bg-teal/20 text-teal text-[9px] border-none">3 Refills Left</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-light">Metformin</span>
                  <Badge className="bg-amber/20 text-amber text-[9px] border-none">Refill Soon</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-light">Atorvastatin</span>
                  <Badge className="bg-teal/20 text-teal text-[9px] border-none">5 Refills Left</Badge>
                </div>
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
                <Button type="submit" className="w-full h-12 font-bold bg-brand-lime text-bg hover:opacity-90 shadow-lg">
                  Save Medication
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
