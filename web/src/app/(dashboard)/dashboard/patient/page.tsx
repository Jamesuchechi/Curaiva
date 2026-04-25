"use client"

import * as React from "react"
import { MetricCard } from "@/components/ui/metric-card"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/loading"
import { 
  Activity, 
  Pill, 
  Smile, 
  MessageSquare, 
  Mic, 
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TriageAssessment {
  severity: 'low' | 'moderate' | 'critical'
  severity_score: number
  primary_concern: string
  likely_conditions: string[]
  recommended_action: string
  self_care_steps: string[]
  red_flags: string[]
  escalate_to_doctor: boolean
  fhir_context_used: boolean
  disclaimer: string
}

export default function PatientDashboard() {
  const [symptoms, setSymptoms] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [assessment, setAssessment] = React.useState<TriageAssessment | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleTriage = async () => {
    if (!symptoms.trim()) return
    setLoading(true)
    setError(null)
    setAssessment(null)

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        body: JSON.stringify({
          symptoms,
          patient_id: "592903" // Demo patient ID
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAssessment(data.assessment)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Metric Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Health Score"
          value="84/100"
          trend={{ value: 4, label: "from last week", direction: "up" }}
          icon={<Activity className="w-5 h-5" />}
          color="teal"
        />
        <MetricCard
          label="Medication Adherence"
          value="92%"
          trend={{ value: 2, label: "missed 1 dose", direction: "down" }}
          icon={<Pill className="w-5 h-5" />}
          color="amber"
        />
        <MetricCard
          label="Today's Mood"
          value="7.5/10"
          trend={{ value: 0.5, label: "improving", direction: "up" }}
          icon={<Smile className="w-5 h-5" />}
          color="purple"
        />
        <MetricCard
          label="Consultations"
          value="2"
          trend={{ value: 1, label: "awaiting reply", direction: "up" }}
          icon={<MessageSquare className="w-5 h-5" />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Triage Panel */}
        <div className="lg:col-span-2 space-y-6">
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
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe your symptoms (e.g., 'I have had a dull headache for 2 days and feel slightly nauseous...')"
                  className="w-full h-32 p-4 rounded-xl bg-surface/50 border border-border-base focus:border-brand-lime outline-none transition-all resize-none text-text-light placeholder:text-text-muted/50"
                />
                <button 
                  className="absolute bottom-4 right-4 p-2 rounded-full bg-surface-2 text-text-muted hover:text-red hover:bg-red/10 transition-all"
                  title="Voice Input"
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                  {symptoms.length} characters
                </span>
                <Button 
                  onClick={handleTriage} 
                  disabled={loading || !symptoms.trim()}
                  className="gap-2"
                >
                  {loading ? <Spinner size="sm" className="border-bg" /> : <><Send className="w-4 h-4" /> Assess Symptoms</>}
                </Button>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red/10 border border-red/20 text-red text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {assessment && (
                <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={assessment.severity === 'critical' ? 'critical' : assessment.severity === 'moderate' ? 'moderate' : 'low'}>
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
                        <Button variant="primary" className="w-full mt-4 group">
                          Connect to Doctor <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <h5 className="text-xs font-mono font-bold text-brand-lime uppercase tracking-widest">Self-Care Steps</h5>
                      <ul className="space-y-2">
                        {assessment.self_care_steps.map((step: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 text-teal shrink-0" />
                            {step}
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
                            <span className="w-1 h-1 rounded-full bg-red mt-1.5 shrink-0" />
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border-base flex items-center justify-between">
                    <span className="text-[10px] font-mono text-text-muted">
                      Source: FHIR Patient 592903 · Claude via MCP
                    </span>
                    <p className="text-[10px] text-text-muted italic max-w-xs text-right">
                      {assessment.disclaimer}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-semibold px-1">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { icon: AlertCircle, color: 'text-red', bg: 'bg-red/10', title: 'Critical Triage Assessment', time: '2 hours ago', desc: 'Chest pain reported' },
                { icon: MessageSquare, color: 'text-brand-green', bg: 'bg-brand-green/10', title: 'Doctor Response', time: 'Yesterday', desc: 'Dr. Sarah sent a follow-up message' },
                { icon: Pill, color: 'text-amber', bg: 'bg-amber/10', title: 'Medication Logged', time: 'Yesterday', desc: 'Lisinopril 10mg taken' },
              ].map((item, i) => (
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

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Medications Card */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Today&apos;s Medications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { name: 'Lisinopril', dose: '10mg', time: '08:00', status: 'taken' },
                  { name: 'Metformin', dose: '500mg', time: '13:00', status: 'pending' },
                  { name: 'Atorvastatin', dose: '20mg', time: '20:00', status: 'pending' },
                ].map((med, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-2/50 border border-border-base">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        med.status === 'taken' ? "bg-teal" : med.status === 'missed' ? "bg-red" : "bg-text-muted"
                      )} />
                      <div>
                        <p className="text-sm font-bold">{med.name}</p>
                        <p className="text-[10px] text-text-muted">{med.dose} • {med.time}</p>
                      </div>
                    </div>
                    {med.status === 'pending' && (
                      <Button size="sm" variant="primary" className="h-7 text-[10px] px-3">Log Dose</Button>
                    )}
                    {med.status === 'taken' && (
                      <span className="text-[10px] text-teal font-medium">✓ Taken</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-brand-lime/10 border border-brand-lime/20 text-center">
                <p className="text-xs font-bold text-brand-lime">🔥 6-day streak!</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Support Card */}
          <Card className="bg-surface border-border-base">
            <CardContent className="p-6 space-y-4 text-center">
              <div className="p-3 bg-purple/10 text-purple rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <Smile className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Need someone to talk to?</h4>
                <p className="text-xs text-text-muted mt-1">Our AI-powered mental health support is available 24/7.</p>
              </div>
              <Button variant="secondary" className="w-full text-xs">Start Session</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
