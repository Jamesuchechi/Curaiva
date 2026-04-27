"use client"

import * as React from "react"
import { StatusDot } from "@/components/ui/feedback"
import { Button } from "@/components/ui/button"
import { Bell, Search } from "lucide-react"
import { Profile } from "@/types"

export function Topbar({ title, profile }: { title: string, profile: Profile | null }) {
  return (
    <header className="h-16 border-b border-border-base bg-bg/50 backdrop-blur-md sticky top-0 z-20 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-display font-bold">{title}</h1>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-border-base">
          <StatusDot status="online" />
          <span className="text-[10px] font-mono font-medium text-text-muted uppercase tracking-wider">
            {profile?.fhir_patient_id ? `FHIR ID: ${profile.fhir_patient_id}` : "FHIR Connected"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 mr-2 px-3 py-1 rounded-lg bg-brand-lime/10 border border-brand-lime/20">
          <span className="text-[10px] font-mono font-bold text-brand-lime uppercase tracking-widest">
            {profile?.role || 'Guest'}
          </span>
        </div>

        <div className="relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-brand-lime transition-colors" />
          <input 
            type="text" 
            placeholder="Search records..." 
            className="h-10 w-64 pl-10 pr-4 rounded-xl bg-surface-2 border border-border-base focus:border-brand-lime outline-none text-sm transition-all"
          />
        </div>
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red rounded-full" />
        </Button>
        
        <Button variant="primary" size="sm" className="hidden sm:flex bg-brand-lime text-bg font-bold">
          AI Assist
        </Button>
      </div>
    </header>
  )
}
