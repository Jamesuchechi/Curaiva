"use client"

import * as React from "react"
import { StatusDot } from "@/components/ui/feedback"
import { Button } from "@/components/ui/button"
import { Bell, Search } from "lucide-react"

export function Topbar({ title }: { title: string }) {
  return (
    <header className="h-16 border-bottom border-border-base bg-bg/50 backdrop-blur-md sticky top-0 z-20 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-display font-bold">{title}</h1>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-border-base">
          <StatusDot status="online" />
          <span className="text-[10px] font-mono font-medium text-text-muted uppercase tracking-wider">FHIR Connected</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
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
        
        <Button variant="primary" size="sm" className="hidden sm:flex">
          AI Assist
        </Button>
      </div>
    </header>
  )
}
