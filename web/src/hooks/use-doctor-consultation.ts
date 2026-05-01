"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase"
import { type Message } from "@/hooks/use-consultations-data"

export interface PatientHistoryItem {
  id: string
  created_at: string
  status: string
  severity: string
  ai_summary: string
}

interface RawConsultation {
  id: string
  created_at: string
  status: string
  priority: string
  ai_summary: string
}

export function useDoctorConsultation(consultationId: string | null, patientId: string | null) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [history, setHistory] = React.useState<PatientHistoryItem[]>([])
  const [loading, setLoading] = React.useState(false)

  const supabase = React.useMemo(() => createClient(), [])

  // Fetch messages
  React.useEffect(() => {
    if (!consultationId) {
      setTimeout(() => setMessages([]), 0)
      return
    }

    const fetchMessages = async () => {
      setLoading(true)
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("consultation_id", consultationId)
        .order("created_at", { ascending: true })
      
      if (data) setMessages(data)
      setLoading(false)
    }

    const timer = setTimeout(() => fetchMessages(), 0)

    const channel = supabase
      .channel(`doc_messages_${consultationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `consultation_id=eq.${consultationId}` },
        (payload) => setMessages(prev => [...prev, payload.new as Message])
      )
      .subscribe()

    return () => { 
      clearTimeout(timer)
      supabase.removeChannel(channel) 
    }
  }, [consultationId, supabase])

  // Fetch Patient History
  React.useEffect(() => {
    if (!patientId) {
      setTimeout(() => setHistory([]), 0)
      return
    }

    const fetchHistory = async () => {
      // Fetch past consultations (excluding the current one)
      const { data } = await supabase
        .from("consultations")
        .select("id, created_at, status, priority, ai_summary")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(10)

      if (data) {
        setHistory((data as unknown as RawConsultation[]).map(c => ({
          id: c.id,
          created_at: c.created_at,
          status: c.status,
          severity: c.priority || "moderate",
          ai_summary: c.ai_summary
        })).filter(c => c.id !== consultationId))
      }
    }

    const timer = setTimeout(() => fetchHistory(), 0)
    return () => clearTimeout(timer)
  }, [patientId, consultationId, supabase])

  const sendMessage = async (senderId: string, content: string) => {
    if (!consultationId || !content.trim()) return
    await supabase.from("messages").insert({
      consultation_id: consultationId,
      sender_id: senderId,
      content
    })
  }

  return { messages, history, loading, sendMessage, supabase }
}
