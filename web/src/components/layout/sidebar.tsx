"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  Pill,
  MessageSquare,
  Heart,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  User
} from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { UserRole } from "@/types"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase"

const navItems = {
  patient: [
    { label: "Dashboard",    icon: LayoutDashboard, href: "/dashboard/patient" },
    { label: "Medications",  icon: Pill,            href: "/dashboard/patient/medications" },
    { label: "Mental Health",icon: Heart,           href: "/dashboard/patient/mental-health" },
    { label: "Consultations",icon: MessageSquare,   href: "/dashboard/patient/consultations" },
    { label: "Profile",      icon: User,            href: "/dashboard/profile" },
    { label: "Notifications",icon: Bell,            href: "/dashboard/notifications" },
  ],
  doctor: [
    { label: "Workspace",  icon: Stethoscope,     href: "/dashboard/doctor" },
    { label: "Patients",   icon: Users,           href: "/dashboard/doctor/patients" },
    { label: "Analytics",  icon: LayoutDashboard, href: "/dashboard/doctor/analytics" },
    { label: "Profile",    icon: User,            href: "/dashboard/profile" },
    { label: "Notifications",icon: Bell,           href: "/dashboard/notifications" },
  ],
  chw: [
    { label: "Command Centre", icon: Users,           href: "/dashboard/chw" },
    { label: "Priority Queue", icon: LayoutDashboard, href: "/dashboard/chw/queue" },
    { label: "Community",      icon: MessageSquare,   href: "/dashboard/chw/community" },
    { label: "Profile",        icon: User,            href: "/dashboard/profile" },
    { label: "Notifications",  icon: Bell,            href: "/dashboard/notifications" },
  ],
}

export function Sidebar({ role = "patient" }: { role?: UserRole }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useAuth()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [signingOut, setSigningOut] = React.useState(false)
  const items = navItems[role]

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const displayName = profile?.full_name || "User"
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
  const shortName = displayName.split(" ")[0] + (displayName.split(" ")[1] ? ` ${displayName.split(" ")[1][0]}.` : "")

  return (
    <aside className={cn(
      "h-full border-r border-border-base bg-bg2 transition-all duration-300 flex flex-col relative",
      isCollapsed ? "w-20" : "w-[240px]"
    )}>
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-brand-lime/20 bg-white shadow-sm">
          <Image src="/logo.png" alt="Curaiva Logo" width={40} height={40} className="object-contain" priority />
        </div>
        {!isCollapsed && (
          <span className="font-display font-bold text-xl tracking-tight">
            Curaiva<span className="text-brand-lime">AI</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {items.map(item => {
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
              {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-brand-lime rounded-r-full" />}
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-brand-lime")} />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Card */}
      <div className="p-4 border-t border-border-base">
        <Link href="/dashboard/profile" className={cn(
          "flex items-center gap-3 p-2 rounded-xl bg-surface-2 hover:bg-surface-2-hover transition-all", 
          isCollapsed && "justify-center",
          pathname === "/dashboard/profile" && "ring-1 ring-brand-lime bg-brand-lime-dim"
        )}>
          <Avatar fallback={initials} size="sm" />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{shortName}</p>
              <p className="text-xs text-text-muted capitalize">{role}</p>
            </div>
          )}
        </Link>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl text-text-muted hover:text-red hover:bg-red/10 transition-all disabled:opacity-50",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && (
            <span className="font-medium text-sm">{signingOut ? "Signing out…" : "Sign Out"}</span>
          )}
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
