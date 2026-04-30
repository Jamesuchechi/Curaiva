"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase"

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'alert' | 'message'
  link: string | null
  is_read: boolean
  created_at: string
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const supabase = React.useMemo(() => createClient(), [])

  const fetchNotifications = React.useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError
      setNotifications(data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  const markAsRead = async (id: string) => {
    try {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)

      if (updateError) throw updateError
      
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (err) {
      console.error("Failed to mark notification as read", err)
    }
  }

  const markAllAsRead = async () => {
    if (!userId) return
    try {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false)

      if (updateError) throw updateError
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      console.error("Failed to mark all as read", err)
    }
  }

  // Initial fetch
  React.useEffect(() => {
    const timer = setTimeout(() => fetchNotifications(), 0)
    return () => clearTimeout(timer)
  }, [fetchNotifications])

  // Realtime subscription
  React.useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
          // Play a subtle sound or trigger a toast could go here
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as Notification : n))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  const unreadCount = notifications.filter(n => !n.is_read).length

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  }
}
