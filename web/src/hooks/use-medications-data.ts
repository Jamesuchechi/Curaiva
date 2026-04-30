"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase"
import type { MedItem } from "./use-dashboard-data"

export interface HistoryDay {
  dayStr: string
  label: string // e.g. "M", "T"
  taken: boolean
}

export interface MedWithHistory extends MedItem {
  adherence: number
  history: HistoryDay[]
}

export function useMedicationsData(userId: string | undefined) {
  const [meds, setMeds] = React.useState<MedWithHistory[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  
  const supabase = React.useMemo(() => createClient(), [])

  const fetchAll = React.useCallback(async (showLoader = false) => {
    // Avoid synchronous setState warning
    await Promise.resolve()

    if (!userId) {
      setLoading(false)
      return
    }

    if (showLoader) {
      setLoading(true)
      setError(null)
    }

    try {
      const today = new Date()
      const todayStr = today.toISOString().split("T")[0]

      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 6) // Last 7 days including today
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0]

      const [medsRes, logsRes] = await Promise.allSettled([
        supabase
          .from("medications")
          .select("id, name, dosage, times")
          .eq("patient_id", userId)
          .eq("active", true),

        supabase
          .from("medication_logs")
          .select("id, medication_id, status, scheduled_at")
          .eq("patient_id", userId)
          .gte("scheduled_at", `${sevenDaysAgoStr}T00:00:00`)
          .lte("scheduled_at", `${todayStr}T23:59:59`)
      ])

      const medsData = medsRes.status === "fulfilled" ? (medsRes.value.data ?? []) : []
      const logsData = logsRes.status === "fulfilled" ? (logsRes.value.data ?? []) : []

      // Generate the last 7 days array
      const last7Days: { dateStr: string; label: string }[] = []
      const DAYS = ["S", "M", "T", "W", "T", "F", "S"]
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        last7Days.push({
          dateStr: d.toISOString().split("T")[0],
          label: DAYS[d.getDay()]
        })
      }

      // Group logs by medication_id and then by date
      const logsMap = new Map<string, Map<string, string>>() // medId -> (dateStr -> status)
      const todayLogsMap = new Map<string, { id: string; status: string }>()

      for (const log of logsData as { id: string; medication_id: string; status: string; scheduled_at: string }[]) {
        const dateStr = new Date(log.scheduled_at).toISOString().split("T")[0]
        
        if (!logsMap.has(log.medication_id)) {
          logsMap.set(log.medication_id, new Map())
        }
        // If there are multiple logs per day, we take 'taken' over anything else
        const existingStatus = logsMap.get(log.medication_id)!.get(dateStr)
        if (existingStatus !== "taken") {
          logsMap.get(log.medication_id)!.set(dateStr, log.status)
        }

        if (dateStr === todayStr) {
          todayLogsMap.set(log.medication_id, { id: log.id, status: log.status })
        }
      }

      const processedMeds: MedWithHistory[] = medsData.flatMap((med: {
        id: string; name: string; dosage: string; times: string[]
      }) => {
        const times: string[] = med.times?.length ? med.times : ["08:00"]
        
        return times.map((time: string) => {
          const medLogs = logsMap.get(med.id)
          const todayLog = todayLogsMap.get(med.id)

          // Calculate history
          const history: HistoryDay[] = last7Days.map(day => {
            const status = medLogs?.get(day.dateStr)
            return {
              dayStr: day.dateStr,
              label: day.label,
              taken: status === "taken"
            }
          })

          // Calculate adherence over the last 7 days
          // Assuming 1 dose per day for simple calculation, but actually looking at days taken
          const daysTaken = history.filter(h => h.taken).length
          const adherence = Math.round((daysTaken / 7) * 100)

          return {
            id: med.id,
            name: med.name,
            dose: med.dosage,
            time,
            status: (todayLog?.status as "pending" | "taken" | "missed" | undefined) ?? "pending",
            logId: todayLog?.id,
            adherence,
            history
          }
        })
      })

      setMeds(processedMeds)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load medications")
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchAll(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchAll])

  React.useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") fetchAll(false)
    }
    const globalRefresh = () => fetchAll(false)
    
    document.addEventListener("visibilitychange", handler)
    window.addEventListener("curaiva-refresh-data", globalRefresh)
    
    return () => {
      document.removeEventListener("visibilitychange", handler)
      window.removeEventListener("curaiva-refresh-data", globalRefresh)
    }
  }, [fetchAll])

  return { meds, loading, error, refetch: () => fetchAll(true), supabase }
}
