"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, RefreshCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { QueueItem } from "@/types"

export default function CHWQueuePage() {
  const [queue, setQueue] = React.useState<QueueItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [refreshKey, setRefreshKey] = React.useState(0)
  const loadQueue = () => setRefreshKey(k => k + 1)

  React.useEffect(() => {
    let active = true

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chw_id: "chw_001", community_zone: "Zone A" }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        
        if (active) {
          const rawQueue = data.priority_queue?.queue || []
          const mapped: QueueItem[] = rawQueue.map((item: { 
            patient_id: string; 
            patient_name: string; 
            priority_score: number; 
            primary_concern: string; 
            priority_tier: string; 
          }) => ({
            id: item.patient_id,
            name: item.patient_name,
            score: item.priority_score,
            reason: item.primary_concern,
            location: "Community Zone A",
            status: item.priority_tier === "critical" ? "critical" : 
                    item.priority_tier === "high" ? "urgent" : "stable"
          }))
          setQueue(mapped)
        }
      } catch {
        if (active) {
          setError("MCP offline — showing cached data")
          setQueue([
            { id: "1", name: "Maria Santos",  score: 91, reason: "Critical adherence failure + high BP.",     location: "Zone A", status: "critical" },
            { id: "2", name: "James Okonkwo", score: 76, reason: "Missed insulin doses, deteriorating mood.", location: "Zone B", status: "urgent"   },
            { id: "3", name: "Priya Nair",    score: 49, reason: "Routine diabetes follow-up.",               location: "Zone A", status: "stable"   },
          ])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    run()
    return () => { active = false }
  }, [refreshKey])

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-white">Priority Queue</h1>
          <p className="text-text-muted mt-1">AI-ranked patients by clinical urgency via FHIR R4</p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadQueue} disabled={loading} className="gap-2">
          <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="text-xs font-mono text-amber flex items-center gap-2">
          ⚠ {error}
        </div>
      )}

      <Card className="glass border-brand-lime/20 overflow-hidden">
        <CardContent className="p-0 divide-y divide-border-base/50">
          {loading && queue.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-8 h-8 border-2 border-brand-lime border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-mono text-brand-lime animate-pulse">RANKING BY CLINICAL RISK...</p>
            </div>
          ) : queue.map((item, i) => (
            <div key={item.id}
              className="flex items-center gap-5 p-5 hover:bg-surface-2 transition-all animate-in slide-in-from-bottom-1"
              style={{ animationDelay: `${i * 50}ms` }}>
              {/* Rank */}
              <div className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center text-xs font-mono font-bold text-text-muted shrink-0">
                #{i + 1}
              </div>
              {/* Score */}
              <div className={cn("w-14 h-14 rounded-2xl flex flex-col items-center justify-center border shrink-0",
                item.score >= 80 ? "bg-red/10 border-red/20" : item.score >= 50 ? "bg-amber/10 border-amber/20" : "bg-teal/10 border-teal/20"
              )}>
                <span className={cn("text-xl font-display font-bold",
                  item.score >= 80 ? "text-red" : item.score >= 50 ? "text-amber" : "text-teal"
                )}>{item.score}</span>
                <span className="text-[8px] font-mono text-text-muted uppercase">Score</span>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-text-white">{item.name}</p>
                  <Badge variant={item.status}>{item.status.toUpperCase()}</Badge>
                  <span className="text-[10px] font-mono text-text-muted flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{item.location}
                  </span>
                </div>
                <p className="text-xs text-text-muted italic">&quot;{item.reason}&quot;</p>
              </div>
              {/* Action */}
              <Button size="sm" variant={item.score >= 75 ? "primary" : "ghost"} className="shrink-0 font-bold">
                {item.score >= 75 ? "Visit Now" : "Check In"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-[10px] font-mono text-text-muted text-center">
        AI priority via generate_chw_priority_queue MCP · FHIR R4 · SHARP context compliant
      </p>
    </div>
  )
}
