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

  const fetchGlobalData = async (type: "all" | "patients" | "practitioners" = "all") => {
    setLoading(true)
    setError(null)
    try {
      const promises = []
      if (type === "all" || type === "patients") promises.push(fetch("/api/discovery/patients").then(r => r.json()))
      if (type === "all" || type === "practitioners") promises.push(fetch("/api/discovery/practitioners").then(r => r.json()))
      
      const results = await Promise.all(promises)
      
      if (type === "all") {
        if (results[0]?.patients) setPatients(results[0].patients)
        if (results[1]?.practitioners) setPractitioners(results[1].practitioners)
      } else if (type === "patients") {
        if (results[0]?.patients) setPatients(results[0].patients)
      } else {
        if (results[0]?.practitioners) setPractitioners(results[0].practitioners)
      }
      
    } catch (err: unknown) {
      console.error("Discovery error:", err)
      setError("Failed to fetch global FHIR discovery data")
    } finally {
      setLoading(false)
    }
  }

  return { patients, practitioners, loading, error, fetchGlobalData }
}
