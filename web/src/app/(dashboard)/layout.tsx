"use client"

import * as React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // In a real app, we'd get the role from an auth context
  // For now, we'll default to patient
  const role = 'patient'
  
  // Dynamic title based on route - could be improved with a custom hook
  const title = "Patient Dashboard"

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar role={role} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={title} />
        
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
