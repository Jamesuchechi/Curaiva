"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import { Spinner } from "@/components/ui/loading"
import { useRouter } from "next/navigation"

interface PatientItem {
  id: string
  consultationId: string
  name: string
  age: number
  condition: string
  severity: "critical" | "moderate" | "low"
  lastSeen: string
}

export default function DoctorPatientsPage() {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<"all" | "critical" | "moderate" | "low">("all")
  const [patients, setPatients] = React.useState<PatientItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const supabase = createClient()

  React.useEffect(() => {
    const fetchPatients = async () => {
      const { data, error } = await supabase
        .from("consultations")
        .select("id, created_at, priority, ai_summary, profiles!patient_id(id, full_name, fhir_patient_id)")
        .order("created_at", { ascending: false })

      if (!error && data) {
        // Group by patient
        const uniquePatients = new Map<string, PatientItem>()
        interface ConsultRow {
          id: string;
          created_at: string;
          priority: string;
          ai_summary: string | null;
          profiles: { id: string; full_name: string; fhir_patient_id: string | null } | null;
        }

        (data as unknown as ConsultRow[]).forEach((c) => {
          const pat = c.profiles
          const fhirId = pat?.fhir_patient_id || "592903"
          if (!uniquePatients.has(fhirId)) {
            uniquePatients.set(fhirId, {
              id: fhirId,
              consultationId: c.id,
              name: pat?.full_name || "Unknown Patient",
              age: 41, // Not provided in current schema, using fallback
              condition: c.ai_summary || "Consultation record",
              severity: (c.priority as "critical" | "moderate" | "low") || "moderate",
              lastSeen: new Date(c.created_at).toLocaleDateString(),
            })
          }
        })
        setPatients(Array.from(uniquePatients.values()))
      }
      setLoading(false)
    }
    fetchPatients()
  }, [supabase])

  const filtered = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.condition.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "all" || p.severity === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-display font-bold text-text-white">Patient Registry</h1>
        <p className="text-text-muted mt-1">Your assigned patients with AI-generated risk profiles</p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patients or conditions..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface border border-border-base focus:border-brand-lime outline-none transition-all text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "critical", "moderate", "low"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-2 rounded-xl text-xs font-bold border transition-all capitalize",
                filter === f ? "bg-brand-lime text-bg border-brand-lime" : "bg-surface border-border-base text-text-muted hover:bg-surface-2"
              )}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <Card className="glass border-brand-lime/20 overflow-hidden min-h-[200px]">
        <CardContent className="p-0 divide-y divide-border-base/50">
          {loading ? (
             <div className="p-12 flex justify-center"><Spinner size="md" className="border-brand-lime" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-text-muted">No patients match your search.</div>
          ) : (
            filtered.map(p => (
              <div 
                key={p.id} 
                onClick={() => router.push(`/dashboard/doctor?consultationId=${p.consultationId}`)}
                className="flex items-center gap-5 p-5 hover:bg-surface-2 transition-all group cursor-pointer"
              >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-lg",
                p.severity === "critical" ? "bg-red/10 text-red" : p.severity === "moderate" ? "bg-amber/10 text-amber" : "bg-teal/10 text-teal"
              )}>
                {p.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-bold text-text-white">{p.name}</p>
                  <Badge variant={p.severity}>{p.severity}</Badge>
                  <span className="text-xs text-text-muted font-mono">FHIR #{p.id}</span>
                </div>
                <p className="text-sm text-text-muted line-clamp-1">{p.condition} · Age {p.age}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-text-muted">Last seen</p>
                <p className="text-sm font-medium">{p.lastSeen}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-[10px] font-mono text-text-muted text-center">
        {filtered.length} of {patients.length} patients shown · FHIR R4 Patient registry · create_consultation_brief available
      </p>
    </div>
  )
}
