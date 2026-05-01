"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase"

export interface Consultation {
  id: string
  doctor_id: string | null
  doctor_name: string
  status: "open" | "active" | "resolved"
  severity: "low" | "moderate" | "high" | "critical"
  created_at: string
  snippet: string
}

export interface Message {
  id: string
  consultation_id: string
  sender_id: string
  sender_role: string
  content: string
  created_at: string
}

export function useConsultationsData(userId: string | undefined) {
  const [consultations, setConsultations] = React.useState<Consultation[]>([])
  const [loadingList, setLoadingList] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(null)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [loadingThread, setLoadingThread] = React.useState(false)

  const supabase = React.useMemo(() => createClient(), [])

  // Fetch all consultations for this user
  const fetchConsultations = React.useCallback(async (showLoader = false) => {
    await Promise.resolve()

    if (!userId) {
      setLoadingList(false)
      return
    }

    if (showLoader) {
      setLoadingList(true)
      setError(null)
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("consultations")
        .select("id, status, priority, created_at, doctor_id, ai_summary")
        .eq("patient_id", userId)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      const formatted = (data ?? []).map(c => ({
        id: c.id,
        doctor_id: c.doctor_id,
        doctor_name: "Clinical Provider",
        status: c.status as "open" | "active" | "resolved",
        severity: (c.priority || "moderate") as "low" | "moderate" | "high" | "critical",
        created_at: c.created_at,
        snippet: c.ai_summary || "No summary available."
      }))

      setConsultations(formatted)
      
      // Auto-select the most recent one if none selected
      if (formatted.length > 0 && !activeThreadId) {
        setActiveThreadId(formatted[0].id)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load consultations")
    } finally {
      setLoadingList(false)
    }
  }, [userId, supabase, activeThreadId])

  // Fetch messages for the active thread
  const fetchThread = React.useCallback(async (consultationId: string) => {
    if (!consultationId) return
    setLoadingThread(true)
    
    try {
      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("id, consultation_id, sender_id, content, created_at")
        .eq("consultation_id", consultationId)
        .order("created_at", { ascending: true })

      if (fetchError) throw fetchError

      const formatted = (data ?? []).map(m => ({
        id: m.id,
        consultation_id: m.consultation_id,
        sender_id: m.sender_id,
        sender_role: m.sender_id === userId ? "patient" : "doctor",
        content: m.content,
        created_at: m.created_at
      }))

      setMessages(formatted)
    } catch (err: unknown) {
      console.error("Failed to load thread", err)
    } finally {
      setLoadingThread(false)
    }
  }, [supabase, userId])

  // Effect to load initial data
  React.useEffect(() => {
    const timer = setTimeout(() => fetchConsultations(false), 0)
    
    const globalRefresh = () => fetchConsultations(false)
    window.addEventListener("curaiva-refresh-data", globalRefresh)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener("curaiva-refresh-data", globalRefresh)
    }
  }, [fetchConsultations])

  // Effect to load thread when active thread changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (activeThreadId) {
        fetchThread(activeThreadId)
      } else {
        setMessages([])
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [activeThreadId, fetchThread])

  // Set up Realtime Subscription for messages
  React.useEffect(() => {
    if (!activeThreadId) return

    const channel = supabase
      .channel(`messages_${activeThreadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `consultation_id=eq.${activeThreadId}` },
        (payload) => {
          // Add the new message to state if we don't already have it
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev
            
            // We need to fetch the sender's role, but since realtime doesn't join, 
            // we'll optimistically append it and assume role based on ID comparison with user
            // In a production app, we might do a quick fetch for the specific message ID.
            const isMe = payload.new.sender_id === userId
            const newMsg: Message = {
              id: payload.new.id,
              consultation_id: payload.new.consultation_id,
              sender_id: payload.new.sender_id,
              sender_role: isMe ? "patient" : "doctor", // rough guess for realtime
              content: payload.new.content,
              created_at: payload.new.created_at
            }
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeThreadId, supabase, userId])

  return { 
    consultations, 
    loadingList, 
    error, 
    refetch: () => fetchConsultations(true),
    
    activeThreadId,
    setActiveThreadId,
    messages,
    loadingThread,
    
    supabase 
  }
}
