"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase"

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type MedStatus = "taken" | "missed" | "pending"

export interface MedItem {
  id: string
  name: string
  dose: string          // e.g. "10mg"
  time: string          // e.g. "08:00"
  status: MedStatus
  logId?: string        // medication_logs.id if a log exists for today
}

export interface ActivityItem {
  id: string
  eventType: string
  title: string
  description: string | null
  severity: "info" | "warning" | "critical"
  createdAt: string
}

export interface DashboardData {
  medications: MedItem[]
  moodWeek: (number | null)[]      // index 0 = Mon … 6 = Sun
  moodToday: number | null
  consultationCount: number
  openConsultationCount: number
  recentActivity: ActivityItem[]
  streak: number                    // consecutive days with ≥1 med taken
  adherencePct: number              // today's adherence %
  healthScore: number               // computed score 0-100
}

/* ─── Health Score Algorithm ────────────────────────────────────────────── */

function computeHealthScore(
  adherencePct: number,
  avgMoodWeek: number,
  criticalTriagesLast7: number
): number {
  const adherenceScore = (adherencePct / 100) * 50         // 0-50
  const moodScore = ((avgMoodWeek || 5) / 10) * 30         // 0-30
  const triagePenalty = Math.max(0, 20 - criticalTriagesLast7 * 5) // 0-20
  return Math.min(100, Math.round(adherenceScore + moodScore + triagePenalty))
}

/* ─── Hook ───────────────────────────────────────────────────────────────── */

export function useDashboardData(userId: string | undefined) {
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const supabase = React.useMemo(() => createClient(), [])

  const fetchAll = React.useCallback(async (showLoader = false) => {
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
      const todayDate = today.toISOString().split("T")[0]

      // Day-of-week index: 0=Mon … 6=Sun (to match DAYS array)
      const jsDay = today.getDay() // 0=Sun…6=Sat
      const todayIdx = jsDay === 0 ? 6 : jsDay - 1

      // Seven days ago boundary
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 7)

      // ── Parallel fetches ──────────────────────────────────
      const [medsRes, logsRes, moodRes, consultRes, activityRes, triageRes] = await Promise.allSettled([
        // 1. Active medications
        supabase
          .from("medications")
          .select("id, name, dosage, times")
          .eq("patient_id", userId)
          .eq("active", true),

        // 2. Today's medication logs
        supabase
          .from("medication_logs")
          .select("id, medication_id, status, scheduled_at")
          .eq("patient_id", userId)
          .gte("scheduled_at", `${todayDate}T00:00:00`)
          .lte("scheduled_at", `${todayDate}T23:59:59`),

        // 3. Last 7 days mood
        supabase
          .from("mental_health_sessions")
          .select("mood_score, created_at")
          .eq("patient_id", userId)
          .gte("created_at", sevenDaysAgo.toISOString())
          .order("created_at", { ascending: true }),

        // 4. Consultations count
        supabase
          .from("consultations")
          .select("id, status")
          .eq("patient_id", userId),

        // 5. Recent activity feed (last 10)
        supabase
          .from("activity_log")
          .select("id, event_type, title, description, severity, created_at")
          .eq("patient_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),

        // 6. Critical triage sessions in last 7 days (for health score)
        supabase
          .from("triage_sessions")
          .select("id, severity")
          .eq("patient_id", userId)
          .eq("severity", "critical")
          .gte("created_at", sevenDaysAgo.toISOString()),
      ])

      // ── Process medications ───────────────────────────────
      const medsData = medsRes.status === "fulfilled" ? (medsRes.value.data ?? []) : []
      const logsData = logsRes.status === "fulfilled" ? (logsRes.value.data ?? []) : []

      // Build a map of medication_id → log for today
      const logByMedId = new Map<string, { id: string; status: string }>(
        logsData.map((l: { medication_id: string; id: string; status: string }) => [
          l.medication_id,
          { id: l.id, status: l.status },
        ])
      )

      const medications: MedItem[] = medsData.flatMap((med: {
        id: string; name: string; dosage: string; times: string[]
      }) => {
        const times: string[] = med.times?.length ? med.times : ["08:00"]
        return times.map((time: string) => {
          const log = logByMedId.get(med.id)
          return {
            id: med.id,
            name: med.name,
            dose: med.dosage,
            time,
            status: (log?.status as MedStatus) ?? "pending",
            logId: log?.id,
          }
        })
      })

      // ── Adherence ─────────────────────────────────────────
      const totalMeds = medications.length
      const takenMeds = medications.filter(m => m.status === "taken").length
      const adherencePct = totalMeds > 0 ? Math.round((takenMeds / totalMeds) * 100) : 100

      // ── Mood ─────────────────────────────────────────────
      const moodRows = moodRes.status === "fulfilled" ? (moodRes.value.data ?? []) : []
      const moodWeek: (number | null)[] = [null, null, null, null, null, null, null]

      for (const row of moodRows as { mood_score: number; created_at: string }[]) {
        const d = new Date(row.created_at)
        const jsD = d.getDay()
        const idx = jsD === 0 ? 6 : jsD - 1
        // Keep the latest entry per day
        if (row.mood_score != null) moodWeek[idx] = row.mood_score
      }

      const moodToday = moodWeek[todayIdx]
      const moodValues = moodWeek.filter((v): v is number => v !== null)
      const avgMoodWeek = moodValues.length
        ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length
        : 5

      // ── Consultations ─────────────────────────────────────
      const consultRows = consultRes.status === "fulfilled" ? (consultRes.value.data ?? []) : []
      const consultationCount = consultRows.length
      const openConsultationCount = (consultRows as { status: string }[]).filter(
        c => c.status !== "resolved"
      ).length

      // ── Activity feed ─────────────────────────────────────
      const activityRows = activityRes.status === "fulfilled" ? (activityRes.value.data ?? []) : []
      const recentActivity: ActivityItem[] = (activityRows as {
        id: string; event_type: string; title: string;
        description: string | null; severity: string; created_at: string
      }[]).map(r => ({
        id: r.id,
        eventType: r.event_type,
        title: r.title,
        description: r.description,
        severity: (r.severity ?? "info") as ActivityItem["severity"],
        createdAt: r.created_at,
      }))

      // ── Streak ────────────────────────────────────────────
      // Count consecutive days (going back from today) where ≥1 med was taken
      let streak = 0
      // We use a simple approach: count taken logs grouped by date
      const { data: streakLogs } = await supabase
        .from("medication_logs")
        .select("scheduled_at")
        .eq("patient_id", userId)
        .eq("status", "taken")
        .order("scheduled_at", { ascending: false })
        .limit(200)

      if (streakLogs?.length) {
        const daySet = new Set(
          (streakLogs as { scheduled_at: string }[]).map(l =>
            new Date(l.scheduled_at).toISOString().split("T")[0]
          )
        )
        const checkDate = new Date(today)
        while (daySet.has(checkDate.toISOString().split("T")[0])) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        }
      }

      // ── Critical triages ──────────────────────────────────
      const criticalTriages =
        triageRes.status === "fulfilled" ? (triageRes.value.data?.length ?? 0) : 0

      // ── Health Score ──────────────────────────────────────
      const healthScore = computeHealthScore(adherencePct, avgMoodWeek, criticalTriages)

      setData({
        medications,
        moodWeek,
        moodToday,
        consultationCount,
        openConsultationCount,
        recentActivity,
        streak,
        adherencePct,
        healthScore,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data")
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

  // Refetch when tab regains focus
  React.useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") fetchAll(false)
    }
    document.addEventListener("visibilitychange", handler)
    return () => document.removeEventListener("visibilitychange", handler)
  }, [fetchAll])

  return { data, loading, error, refetch: () => fetchAll(true) }
}
