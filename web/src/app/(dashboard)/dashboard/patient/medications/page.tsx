"use client"

import * as React from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pill, CheckCircle2, Clock, RefreshCcw } from "lucide-react"
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-display font-bold text-text-white">Medications</h1>
        <p className="text-text-muted mt-1">Track your prescriptions and daily adherence</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Today's Doses", value: `${takenCount}/${meds.length}`, color: "text-brand-lime", icon: <Pill className="w-4 h-4" /> },
          { label: "Avg Adherence", value: `${adherencePct}%`, color: adherencePct >= 80 ? "text-teal" : "text-amber", icon: <RefreshCcw className="w-4 h-4" /> },
          { label: "Active Streak", value: "6 days 🔥", color: "text-amber", icon: <CheckCircle2 className="w-4 h-4" /> },
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

      {/* Today's list */}
      <Card className="glass border-brand-lime/20">
        <CardHeader className="pb-2">
          <h2 className="text-lg font-display font-semibold">Today&apos;s Schedule</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {meds.map(med => (
            <div key={med.id} className={cn(
              "flex items-center gap-4 p-4 rounded-2xl border transition-all",
              med.taken ? "bg-teal/5 border-teal/20" : "bg-surface border-border-base"
            )}>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                med.taken ? "bg-teal/20 text-teal" : "bg-surface-2 text-text-muted"
              )}>
                {med.taken ? <CheckCircle2 className="w-5 h-5" /> : <Pill className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-text-white">{med.name}</p>
                  <Badge variant="stable" className="text-[10px]">{med.dose}</Badge>
                </div>
                <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" /> {med.schedule} · {med.adherence}% adherence
                </p>
              </div>
              {!med.taken ? (
                <Button size="sm" onClick={() => logDose(med.id)} disabled={logging === med.id}
                  className="text-xs font-bold h-8">
                  {logging === med.id ? "Logging…" : "Log Dose"}
                </Button>
              ) : (
                <span className="text-xs font-mono font-bold text-teal">✓ Taken</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 7-day history grid */}
      <Card className="glass">
        <CardHeader className="pb-2">
          <h2 className="text-lg font-display font-semibold">7-Day History</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {meds.map(med => (
              <div key={med.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{med.name}</span>
                  <span className="text-xs font-mono text-text-muted">{med.adherence}%</span>
                </div>
                <div className="flex gap-2">
                  {DAYS.map((day) => {
                    const taken = Math.random() > (1 - med.adherence / 100)
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1">
                        <div className={cn("w-full h-7 rounded-lg flex items-center justify-center text-[10px] font-bold",
                          taken ? "bg-teal/20 text-teal" : "bg-red/10 text-red/60"
                        )}>
                          {taken ? "✓" : "✗"}
                        </div>
                        <span className="text-[9px] font-mono text-text-muted">{day[0]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FHIR provenance */}
      <p className="text-[10px] font-mono text-text-muted text-center">
        FHIR ID: {profile?.fhir_patient_id ?? "592903"} · MedicationRequest R4 · Adherence via check_medication_adherence MCP
      </p>
    </div>
  )
}
