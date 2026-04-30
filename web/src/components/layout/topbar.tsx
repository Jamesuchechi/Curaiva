"use client"

import * as React from "react"
import { StatusDot } from "@/components/ui/feedback"
import { Button } from "@/components/ui/button"
import { Bell, Search, Sparkles, X } from "lucide-react"
import { Profile } from "@/types"
import { useAIPanel } from "@/components/providers/ai-panel-provider"
import { useNotifications } from "@/hooks/use-notifications"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

/* ─── Mock removed for real data hook ─── */

/* ─── Component ─────────────────────────────────────────────────────────── */

export function Topbar({ title, profile }: { title: string; profile: Profile | null }) {
  const router = useRouter()
  const { open: openAI } = useAIPanel()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(profile?.id)
  
  const [showNotifications, setShowNotifications] = React.useState(false)
  const notifRef = React.useRef<HTMLDivElement>(null)

  // Close notification dropdown when clicking outside
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleNotifClick = (id: string, link: string | null) => {
    markAsRead(id)
    if (link) {
      router.push(link)
      setShowNotifications(false)
    }
  }

  return (
    <header className="h-16 border-b border-border-base bg-bg/50 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between shrink-0">
      {/* Left */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-display font-bold text-text-white">{title}</h1>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border-base">
          <StatusDot status="online" />
          <span className="text-[10px] font-mono font-medium text-text-muted uppercase tracking-wider">
            {profile?.fhir_patient_id ? `FHIR: ${profile.fhir_patient_id}` : "FHIR Connected"}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Role badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-lime/10 border border-brand-lime/20">
          <span className="text-[10px] font-mono font-bold text-brand-lime uppercase tracking-widest">
            {profile?.role ?? "Guest"}
          </span>
        </div>

        {/* Search */}
        <div className="relative group hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-brand-lime transition-colors" />
          <input
            type="text"
            placeholder="Search records..."
            className="h-9 w-52 pl-9 pr-4 rounded-xl bg-surface border border-border-base focus:border-brand-lime/50 outline-none text-sm transition-all placeholder:text-text-muted"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
            onClick={() => setShowNotifications(v => !v)}
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red rounded-full" />
            )}
          </Button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border-base rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-border-base flex items-center justify-between">
                  <h3 className="font-bold text-sm">Notifications</h3>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-brand-lime uppercase hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-text-muted hover:text-text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-border-base scrollbar-hide">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-xs text-text-muted italic">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n.id, n.link)}
                        className={cn(
                          "p-4 hover:bg-surface-2 cursor-pointer transition-colors relative",
                          !n.is_read && "bg-surface-2/40"
                        )}
                      >
                        {!n.is_read && (
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-lime rounded-full" />
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            n.type === 'alert' || n.type === 'warning' ? "bg-red" : "bg-brand-lime"
                          )} />
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-wider",
                            n.type === 'alert' || n.type === 'warning' ? "text-red" : "text-brand-lime"
                          )}>
                            {n.type}
                          </span>
                          <span className="text-[9px] font-mono text-text-muted ml-auto">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-text-white">{n.title}</p>
                        <p className="text-xs text-text-muted mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 bg-surface-2/30 border-t border-border-base text-center">
                  <button 
                    onClick={() => { router.push('/dashboard/notifications'); setShowNotifications(false); }}
                    className="text-[10px] font-bold text-text-muted uppercase tracking-widest hover:text-white transition-colors"
                  >
                    View All Activity
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Assist button — wires to global context */}
        <Button
          onClick={() => openAI()}
          className="hidden sm:flex items-center gap-2 bg-brand-lime text-bg font-bold h-9 px-4 rounded-xl hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Assist
        </Button>
      </div>
    </header>
  )
}
