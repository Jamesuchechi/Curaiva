"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase"
import { Profile } from "@/types"

export interface DoctorProfile extends Profile {
  specialty: string | null
  bio: string | null
  is_available: boolean
  rating: number
  years_experience: number
  matchScore?: number
}

export function useDoctorsData(patientConditionKeywords: string[] = []) {
  const [doctors, setDoctors] = React.useState<DoctorProfile[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const supabase = React.useMemo(() => createClient(), [])

  const fetchDoctors = React.useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "doctor")
        .eq("is_available", true)
        .order("rating", { ascending: false })

      if (fetchError) throw fetchError

      // Compute match score client-side
      const scoredDoctors = (data || []).map((doc: DoctorProfile) => {
        let score = 0
        
        // Base score for availability
        if (doc.is_available) score += 30
        
        // Base score for rating
        if (doc.rating) score += (doc.rating * 4) // Max 20 pts for 5.0 rating
        
        // Specialty matching (super simple keyword matching)
        if (doc.specialty && patientConditionKeywords.length > 0) {
          const specialtyLower = doc.specialty.toLowerCase()
          const matchedKeywords = patientConditionKeywords.filter(k => specialtyLower.includes(k.toLowerCase()))
          score += (matchedKeywords.length * 25) // Up to 50 pts
        }

        return { ...doc, matchScore: Math.min(score, 100) } as DoctorProfile
      })

      // Sort by score
      scoredDoctors.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))

      setDoctors(scoredDoctors)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load doctors")
    } finally {
      setLoading(false)
    }
  }, [supabase, patientConditionKeywords])

  React.useEffect(() => {
    const timer = setTimeout(() => fetchDoctors(), 0)
    return () => clearTimeout(timer)
  }, [fetchDoctors])

  return { doctors, loading, error, refetch: fetchDoctors }
}
