"use client"

import * as React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { useAuth } from "@/components/providers/auth-provider"
import { usePathname } from "next/navigation"
import { Spinner } from "@/components/ui/loading"
import { UserRole } from "@/types"
import { AIPanelProvider, useAIPanel } from "@/components/providers/ai-panel-provider"
import { AIPanel } from "@/components/ai-panel/ai-panel"

/* ─── Titles & Role sync ────────────────────────────────────────────────── */

const PAGE_TITLES: Record<string, string> = {
  '/dashboard/patient': 'Patient Dashboard',
  '/dashboard/patient/medications': 'My Medications',
  '/dashboard/patient/mental-health': 'Mental Health Support',
  '/dashboard/patient/consultations': 'My Consultations',
  '/dashboard/doctor': 'Physician Workspace',
  '/dashboard/doctor/patients': 'Patient Management',
  '/dashboard/doctor/analytics': 'Clinical Analytics',
  '/dashboard/chw': 'Community Command Centre',
  '/dashboard/chw/queue': 'AI Priority Queue',
  '/dashboard/chw/community': 'Community Health Feed',
  '/dashboard/notifications': 'Notifications & Alerts',
}

/* ─── Inner layout — needs access to useAIPanel context ─────────────────── */

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  const pathname = usePathname()
  const { setCurrentPage, setRole } = useAIPanel()

  const title = PAGE_TITLES[pathname] || "Dashboard"
  const role = (profile?.role || "patient") as UserRole

  // Keep the AI panel aware of the current page and role
  React.useEffect(() => {
    setCurrentPage(title)
    setRole(role)
  }, [title, role, setCurrentPage, setRole])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <Spinner size="lg" className="border-brand-lime" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar role={role} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={title} profile={profile} />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* AI Panel — renders at the root, outside the scrollable content */}
      <AIPanel />
    </div>
  )
}

/* ─── Root layout — wraps with provider ─────────────────────────────────── */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AIPanelProvider>
      <DashboardShell>{children}</DashboardShell>
    </AIPanelProvider>
  )
}
