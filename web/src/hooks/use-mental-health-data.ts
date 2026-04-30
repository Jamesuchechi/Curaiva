"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase"

export interface MoodLog {
  id: string
  score: number
  notes: string | null
  dateStr: string // "YYYY-MM-DD"
  crisisFlagged: boolean
}

export interface MentalHealthData {
  logs: MoodLog[]
  avgMood: number
  sessionsThisWeek: number
  streak: number
  // A 7-day array aligned with ["S", "M", "T", "W", "T", "F", "S"] ending today or starting 6 days ago.
  // We'll provide an array of 7 items representing the last 7 days.
  trendChart: {
    dayLabel: string // "Mon"
    score: number | null
    notes: string | null
  }[]
}

export function useMentalHealthData(userId: string | undefined) {
  const [data, setData] = React.useState<MentalHealthData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const supabase = React.useMemo(() => createClient(), [])

  const fetchAll = React.useCallback(async (showLoader = false) => {
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

      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)

      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 6)

      // Fetch last 30 days of mood logs for streak calculation
      const { data: logsData, error: fetchError } = await supabase
        .from("mental_health_sessions")
        .select("id, mood_score, session_notes, created_at, crisis_flagged")
        .eq("patient_id", userId)
        .gte("created_at", `${thirtyDaysAgo.toISOString().split("T")[0]}T00:00:00`)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      const logs: MoodLog[] = (logsData ?? []).map(l => ({
        id: l.id,
        score: l.mood_score,
        notes: l.session_notes,
        dateStr: new Date(l.created_at).toISOString().split("T")[0],
        crisisFlagged: l.crisis_flagged
      }))

      // Filter for last 7 days for the chart and averages
      const last7DaysLogs = logs.filter(l => new Date(l.dateStr) >= new Date(sevenDaysAgo.toISOString().split("T")[0]))

      const sessionsThisWeek = last7DaysLogs.length
      const avgMood = sessionsThisWeek > 0 
        ? Math.round(last7DaysLogs.reduce((a, b) => a + b.score, 0) / sessionsThisWeek) 
        : 0

      // Calculate streak (consecutive days logged going backward from today)
      let streak = 0
      const loggedDays = new Set(logs.map(l => l.dateStr))
      const checkDate = new Date(today)
      
      // If they haven't logged today, check if they logged yesterday to keep the streak alive
      if (!loggedDays.has(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1)
      }

      while (loggedDays.has(checkDate.toISOString().split("T")[0])) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      }

      // Generate the last 7 days chart data
      const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      const trendChart = []
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const dStr = d.toISOString().split("T")[0]
        
        // Find the most recent log for this day
        const dayLog = last7DaysLogs.find(l => l.dateStr === dStr)
        
        trendChart.push({
          dayLabel: DAYS[d.getDay()],
          score: dayLog ? dayLog.score : null,
          notes: dayLog ? dayLog.notes : null
        })
      }

      setData({
        logs,
        avgMood,
        sessionsThisWeek,
        streak,
        trendChart
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load mental health data")
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  React.useEffect(() => {
    const timer = setTimeout(() => fetchAll(false), 0)
    return () => clearTimeout(timer)
  }, [fetchAll])

  React.useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") fetchAll(false)
    }
    document.addEventListener("visibilitychange", handler)
    return () => document.removeEventListener("visibilitychange", handler)
  }, [fetchAll])

  return { data, loading, error, refetch: () => fetchAll(true), supabase }
}
