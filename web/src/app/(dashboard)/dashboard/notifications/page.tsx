"use client"

import * as React from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { useNotifications } from "@/hooks/use-notifications"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/loading"
import { Bell, CheckCircle2, MessageSquare, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function NotificationsPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications(profile?.id)

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertCircle className="w-5 h-5 text-red" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber" />
      case 'message': return <MessageSquare className="w-5 h-5 text-purple" />
      case 'success': return <CheckCircle2 className="w-5 h-5 text-teal" />
      default: return <Info className="w-5 h-5 text-brand-lime" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-brand-lime" />
            Notifications
          </h1>
          <p className="text-text-muted mt-1">Stay updated with your clinical alerts and messages</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={markAllAsRead} className="text-xs font-bold uppercase tracking-widest text-text-muted hover:text-brand-lime">
            Mark all as read
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="glass border-dashed border-border-base">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-text-muted opacity-20" />
            </div>
            <h3 className="text-lg font-bold text-text-white">All caught up!</h3>
            <p className="text-sm text-text-muted max-w-xs mt-2">You don&apos;t have any notifications at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <Card 
              key={n.id} 
              className={cn(
                "glass transition-all border-l-4",
                !n.is_read ? "border-l-brand-lime bg-brand-lime/5" : "border-l-transparent opacity-80"
              )}
            >
              <CardContent className="p-0">
                <div 
                  className="flex items-start gap-4 p-6 cursor-pointer"
                  onClick={() => {
                    markAsRead(n.id)
                    if (n.link) router.push(n.link)
                  }}
                >
                  <div className="mt-1">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={cn("text-lg font-bold", !n.is_read ? "text-text-white" : "text-text-light")}>
                        {n.title}
                      </h3>
                      <span className="text-xs font-mono text-text-muted shrink-0">
                        {new Date(n.created_at).toLocaleDateString()} · {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed mb-4">
                      {n.message}
                    </p>
                    {n.link && (
                      <Button variant="secondary" size="sm" className="h-8 text-[10px] uppercase font-bold tracking-widest bg-surface-2 hover:bg-surface border border-border-base">
                        View Details
                      </Button>
                    )}
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-brand-lime mt-2 shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="pt-8 border-t border-border-base text-center">
        <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
          End of activity log · Powered by Supabase Realtime
        </p>
      </div>
    </div>
  )
}
