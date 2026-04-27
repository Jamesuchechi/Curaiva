"use client"

import * as React from "react"
import { Terminal, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TraceEntry {
  id: string
  tool: string
  status: 'pending' | 'success' | 'error'
  timestamp: string
  resources?: string[]
  duration?: number
}

export function ToolTrace({ entries }: { entries: TraceEntry[] }) {
  const [isOpen, setIsOpen] = React.useState(true)

  if (entries.length === 0) return null

  return (
    <div className={cn(
      "fixed bottom-6 right-6 w-80 bg-surface/90 backdrop-blur-xl border border-border-base rounded-2xl shadow-2xl transition-all duration-300 z-50 overflow-hidden",
      !isOpen && "h-12 w-48"
    )}>
      {/* Header */}
      <div 
        className="h-12 px-4 flex items-center justify-between cursor-pointer hover:bg-surface-2 transition-colors border-b border-border-base"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-brand-lime" />
          <span className="text-xs font-mono font-bold tracking-tight">MCP Tool Trace</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-brand-lime animate-pulse" />
          <span className="text-[10px] font-mono text-text-muted">{entries.length} active</span>
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="max-h-80 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {entries.map((entry) => (
            <div key={entry.id} className="p-3 rounded-xl bg-bg border border-border-base/50 space-y-2 animate-in slide-in-from-right-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {entry.status === 'success' ? (
                    <CheckCircle2 className="w-3 h-3 text-teal" />
                  ) : entry.status === 'error' ? (
                    <AlertCircle className="w-3 h-3 text-red" />
                  ) : (
                    <Clock className="w-3 h-3 text-amber animate-spin" />
                  )}
                  <span className="text-[11px] font-mono font-bold text-text-light">{entry.tool}</span>
                </div>
                <span className="text-[9px] font-mono text-text-muted">{entry.timestamp}</span>
              </div>
              
              {entry.resources && entry.resources.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.resources.map((res, i) => (
                    <span key={i} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-brand-lime/10 text-brand-lime border border-brand-lime/20">
                      {res}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-1 border-t border-border-base/30">
                <span className={cn(
                  "text-[9px] font-mono font-medium",
                  entry.status === 'success' ? "text-teal" : entry.status === 'error' ? "text-red" : "text-amber"
                )}>
                  {entry.status.toUpperCase()}
                </span>
                {entry.duration && (
                  <span className="text-[9px] font-mono text-text-muted">{entry.duration}ms</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
