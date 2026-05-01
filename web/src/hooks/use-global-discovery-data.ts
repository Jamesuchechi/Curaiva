"use client"

import * as React from "react"

export interface GlobalPatient {
  id: string
  name: string
  gender: string
  birthDate: string
}

export interface GlobalPractitioner {
  id: string
  name: string
  gender: string
  specialty?: string
}

export function useGlobalDiscoveryData() {
  const [patients, setPatients] = React.useState<GlobalPatient[]>([])
  const [practitioners, setPractitioners] = React.useState<GlobalPractitioner[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchGlobalData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [patRes, pracRes] = await Promise.all([
        fetch("/api/discovery/patients"),
        fetch("/api/discovery/practitioners")
      ])

      const patData = await patRes.json()
      const pracData = await pracRes.json()

      if (patData.patients) setPatients(patData.patients)
      if (pracData.practitioners) setPractitioners(pracData.practitioners)
      
    } catch (err: unknown) {
      console.error("Discovery error:", err)
      setError("Failed to fetch global FHIR discovery data")
    } finally {
      setLoading(false)
    }
  }

  return { patients, practitioners, loading, error, fetchGlobalData }
}
