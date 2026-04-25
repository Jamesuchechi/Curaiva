"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Stethoscope, 
  Users, 
  Pill, 
  MessageSquare, 
  Heart,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react"
import { Avatar } from "@/components/ui/avatar"

const navItems = {
  patient: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/patient' },
    { label: 'Medications', icon: Pill, href: '/dashboard/patient/medications' },
    { label: 'Mental Health', icon: Heart, href: '/dashboard/patient/mental-health' },
    { label: 'Consultations', icon: MessageSquare, href: '/dashboard/patient/consultations' },
  ],
  doctor: [
    { label: 'Workspace', icon: Stethoscope, href: '/dashboard/doctor' },
    { label: 'Patients', icon: Users, href: '/dashboard/doctor/patients' },
    { label: 'Analytics', icon: LayoutDashboard, href: '/dashboard/doctor/analytics' },
  ],
  chw: [
    { label: 'Command Centre', icon: Users, href: '/dashboard/chw' },
    { label: 'Priority Queue', icon: LayoutDashboard, href: '/dashboard/chw/queue' },
    { label: 'Community', icon: MessageSquare, href: '/dashboard/chw/community' },
  ]
}

export function Sidebar({ role = 'patient' }: { role?: 'patient' | 'doctor' | 'chw' }) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const items = navItems[role]

  return (
    <aside className={cn(
      "h-full border-r border-border-base bg-bg2 transition-all duration-300 flex flex-col relative",
      isCollapsed ? "w-20" : "w-[240px]"
    )}>
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-lime flex items-center justify-center shrink-0">
          <Heart className="w-5 h-5 text-bg fill-current" />
        </div>
        {!isCollapsed && (
          <span className="font-display font-bold text-xl tracking-tight">Curaiva<span className="text-brand-lime">AI</span></span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-brand-lime-dim text-brand-lime" 
                  : "text-text-muted hover:text-text-light hover:bg-surface-2"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-brand-lime rounded-r-full" />
              )}
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-brand-lime")} />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Card */}
      <div className="p-4 border-t border-border-base">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-xl bg-surface-2",
          isCollapsed ? "justify-center" : ""
        )}>
          <Avatar fallback="JU" size="sm" />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">James U.</p>
              <p className="text-xs text-text-muted capitalize">{role}</p>
            </div>
          )}
        </div>
        
        <button className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl text-text-muted hover:text-red hover:bg-red/10 transition-all",
          isCollapsed ? "justify-center" : ""
        )}>
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm">Sign Out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full border border-border-base bg-surface-2 flex items-center justify-center hover:bg-surface-2/80 transition-all z-10"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
