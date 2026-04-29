"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin, Heart, Pill } from "lucide-react"
import { cn } from "@/lib/utils"

const ZONES = [
  { name: "Zone A", patients: 18, criticalCount: 2, avgAdherence: 71, avgMood: 6.2 },
  { name: "Zone B", patients: 14, criticalCount: 1, avgAdherence: 65, avgMood: 5.8 },
  { name: "Zone C", patients: 10, criticalCount: 0, avgAdherence: 83, avgMood: 7.1 },
]

const COMMUNITY_INSIGHTS = [
  { label: "Avg Medication Adherence", value: "68%", trend: "-4% this week", color: "text-amber", icon: <Pill className="w-4 h-4" /> },
  { label: "Avg Community Mood",       value: "6.2/10", trend: "+0.3 this week", color: "text-teal", icon: <Heart className="w-4 h-4" /> },
  { label: "Total Assigned Patients",  value: "42", trend: "3 new this month",  color: "text-brand-lime", icon: <Users className="w-4 h-4" /> },
]

const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"]
const ADHERENCE_TREND = [72, 69, 74, 71, 68, 68]

export default function CHWCommunityPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-display font-bold text-text-white">Community Overview</h1>
        <p className="text-text-muted mt-1">Aggregate health metrics across your assigned zones</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {COMMUNITY_INSIGHTS.map(c => (
          <Card key={c.label} className="glass p-5 flex items-center gap-4">
            <div className={cn("p-2 rounded-xl bg-surface-2", c.color)}>{c.icon}</div>
            <div>
              <p className="text-xs text-text-muted">{c.label}</p>
              <p className={cn("text-2xl font-display font-bold", c.color)}>{c.value}</p>
              <p className="text-[10px] font-mono text-text-muted">{c.trend}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Zone breakdown */}
      <Card className="glass border-brand-lime/20">
        <CardHeader className="pb-2">
          <h2 className="text-lg font-display font-semibold">Zone Breakdown</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {ZONES.map(z => (
            <div key={z.name} className="p-4 rounded-2xl border border-border-base bg-surface space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-lime" />
                  <span className="font-bold">{z.name}</span>
                  <Badge variant="stable">{z.patients} patients</Badge>
                </div>
                {z.criticalCount > 0 && (
                  <Badge variant="critical">{z.criticalCount} critical</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-muted text-xs mb-1">Adherence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-surface-2">
                      <div className={cn("h-2 rounded-full", z.avgAdherence >= 80 ? "bg-teal" : "bg-amber")}
                        style={{ width: `${z.avgAdherence}%` }} />
                    </div>
                    <span className={cn("font-mono font-bold text-xs", z.avgAdherence >= 80 ? "text-teal" : "text-amber")}>
                      {z.avgAdherence}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-text-muted text-xs mb-1">Avg Mood</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-surface-2">
                      <div className="h-2 rounded-full bg-purple" style={{ width: `${(z.avgMood / 10) * 100}%` }} />
                    </div>
                    <span className="font-mono font-bold text-xs text-purple">{z.avgMood}/10</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Adherence trend chart */}
      <Card className="glass">
        <CardHeader className="pb-2">
          <h2 className="text-lg font-display font-semibold">Community Adherence Trend</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3" style={{ height: 100 }}>
            {ADHERENCE_TREND.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end" style={{ height: 80 }}>
                  <div className={cn("w-full rounded-t-lg", v >= 75 ? "bg-teal/50" : "bg-amber/50")}
                    style={{ height: `${(v / 100) * 80}px` }} />
                </div>
                <span className="text-[9px] font-mono text-text-muted">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-3 font-mono text-center">
            Target: 80% · Current: 68% · Δ -12pp gap
          </p>
        </CardContent>
      </Card>

      <p className="text-[10px] font-mono text-text-muted text-center">
        Community metrics derived from FHIR R4 · check_medication_adherence + mental_health_assessment MCP tools
      </p>
    </div>
  )
}
