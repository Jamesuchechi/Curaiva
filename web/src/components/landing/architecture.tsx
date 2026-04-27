"use client"

import * as React from "react"
import { Database, Shield, Zap, Smartphone, Code2 } from "lucide-react"

export function Architecture() {
  return (
    <section id="architecture" className="py-24 bg-bg relative overflow-hidden">
      {/* Background Decorative Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-lime/5 rounded-full blur-[150px] opacity-30" />
      
      <div className="container px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-16 items-center">
          {/* Top Left: Text Description */}
          <div className="lg:col-span-5">
            <p className="text-[10px] font-mono font-bold text-brand-lime uppercase tracking-[0.2em] mb-4">
              Deep Integration
            </p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-text-white mb-6 leading-tight">
              FHIR Native.<br />
              <em className="font-light italic text-brand-lime">A2A Ready.</em>
            </h2>
            <p className="text-text-muted mb-8 leading-relaxed">
              Curaiva leverages Prompt Opinion&apos;s SHARP protocol to ingest clinical context 
              automatically. Our tools communicate via COIN intents, allowing other agents 
              to orchestrate complex medical workflows through us.
            </p>
          </div>

          {/* Top Right: Visual Code/Diagram Section */}
          <div className="lg:col-span-7 relative group">
            <div className="p-1 rounded-[32px] bg-linear-to-br from-brand-lime/20 via-border-base to-teal/20">
              <div className="bg-bg rounded-[28px] overflow-hidden border border-white/5 shadow-2xl">
                {/* Header */}
                <div className="px-6 py-4 bg-surface-2/50 border-b border-border-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-brand-lime" />
                    <span className="text-[10px] font-mono font-bold text-text-muted uppercase">sharp_context.json</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-brand-lime shadow-[0_0_8px_rgba(132,204,22,0.5)]" />
                </div>
                
                {/* Code Snippet */}
                <div className="p-8 font-mono text-[11px] leading-relaxed">
                  <div className="text-text-muted mb-2">{"// Automatic context via Prompt Opinion"}</div>
                  <div className="flex gap-4">
                    <span className="text-text-muted w-4">1</span>
                    <span className="text-text-white">&#123;</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-text-muted w-4">2</span>
                    <span className="pl-4 text-brand-lime">&quot;fhir_base_url&quot;</span>: <span className="text-teal">&quot;https://hapi.fhir.org/baseR4&quot;</span>,
                  </div>
                  <div className="flex gap-4">
                    <span className="text-text-muted w-4">3</span>
                    <span className="pl-4 text-brand-lime">&quot;patient_id&quot;</span>: <span className="text-teal">&quot;592903&quot;</span>,
                  </div>
                  <div className="flex gap-4">
                    <span className="text-text-muted w-4">4</span>
                    <span className="pl-4 text-brand-lime">&quot;practitioner_id&quot;</span>: <span className="text-teal">&quot;PRAC-044&quot;</span>,
                  </div>
                  <div className="flex gap-4">
                    <span className="text-text-muted w-4">5</span>
                    <span className="pl-4 text-brand-lime">&quot;access_token&quot;</span>: <span className="text-text-muted italic">&quot;Bearer eyJ...&quot;</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-text-muted w-4">6</span>
                    <span className="text-text-white">&#125;</span>
                  </div>
                  
                  <div className="mt-8 text-text-muted mb-2">{"// FHIR Tool Execution"}</div>
                  <div className="flex gap-4">
                    <span className="text-text-muted w-4">7</span>
                    <div>
                      <span className="text-brand-lime">GET</span> <span className="text-text-white">/Patient/592903</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-text-muted w-4">8</span>
                    <div>
                      <span className="text-brand-lime">GET</span> <span className="text-text-white">/Observation?patient=592903&category=vital-signs</span>
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="px-6 py-3 bg-surface-2/30 border-t border-border-base flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal" />
                    <span className="text-[9px] font-mono text-teal font-bold uppercase">Success</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-lime" />
                    <span className="text-[9px] font-mono text-brand-lime font-bold uppercase">MCP Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: 4 Feature Cards */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-white/5">
            {[
              { icon: Shield, title: "SHARP Sync", desc: "Automatic session propagation from EHR systems." },
              { icon: Zap, title: "COIN Intents", desc: "Standardized agent-to-agent clinical communication." },
              { icon: Database, title: "HAPI FHIR", desc: "Tested against globally compliant FHIR R4 servers." },
              { icon: Smartphone, title: "Edge Ready", desc: "Designed for low-latency clinical mobile deployment." },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-3xl bg-surface-2/40 border border-border-base hover:border-brand-lime/30 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-bg border border-border-base flex items-center justify-center text-brand-lime group-hover:text-bg group-hover:bg-brand-lime transition-all mb-4">
                  <item.icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-text-white mb-2">{item.title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  )
}
