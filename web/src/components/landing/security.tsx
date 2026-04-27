"use client"

import * as React from "react"
import { ShieldAlert, Lock, EyeOff, CheckCircle2 } from "lucide-react"

export function Security() {
  return (
    <section className="py-32 bg-bg border-y border-white/5 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-red/10 to-transparent" />
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-red/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red/10 border border-red/20 text-red text-xs font-mono font-bold tracking-widest uppercase mb-6 animate-in fade-in zoom-in-95 duration-1000">
             <ShieldAlert className="w-3 h-3" />
             Trust & Security
          </div>
          <h2 className="text-5xl md:text-6xl font-display font-black text-text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
            Clinical safety is <br />
            <em className="font-light italic text-transparent bg-clip-text bg-gradient-to-r from-red to-orange-500">non-negotiable</em>.
          </h2>
          <p className="text-text-muted text-lg leading-relaxed mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            Curaiva AI doesn&apos;t just process data—it protects it. By utilizing 
            transient FHIR fetching and SHARP context propagation, we eliminate 
            the need for persistent clinical storage.
          </p>
          <div className="flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="px-5 py-2.5 rounded-xl bg-surface/50 border border-white/5 backdrop-blur-md flex items-center gap-3 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-red animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-text-white uppercase tracking-widest">SHARP Certified</span>
            </div>
            <div className="px-5 py-2.5 rounded-xl bg-surface/50 border border-white/5 backdrop-blur-md flex items-center gap-3 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-red animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-text-white uppercase tracking-widest">A2A Compliant</span>
            </div>
          </div>
        </div>

        {/* Centered Cards */}
        <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
          {[
            { icon: Lock, title: "Transient Processing", desc: "We never store patient data. All clinical fetching is performed at runtime and wiped from memory after execution." },
            { icon: EyeOff, title: "Encrypted Context", desc: "SHARP session tokens are handled within Prompt Opinion's secure enclave, never exposed to our agent logs." },
            { icon: ShieldAlert, title: "HIPAA Compliant", desc: "Designed from day one to meet the highest standards of clinical data privacy and PHI protection." },
            { icon: CheckCircle2, title: "A2A Verified", desc: "Every intent emitted via COIN is cryptographically signed and verified by the Agents Assemble ecosystem." },
          ].map((item, i) => (
            <div 
              key={item.title} 
              className="group relative w-full md:w-[calc(50%-1rem)] animate-in fade-in slide-in-from-bottom-12 duration-1000"
              style={{ animationDelay: `${400 + i * 150}ms`, animationFillMode: 'both' }}
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red/0 via-red/20 to-orange-500/0 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none" />
              
              <div className="relative p-8 rounded-2xl bg-surface-2/30 backdrop-blur-xl border border-white/5 group-hover:border-red/30 transition-all duration-500 h-full flex flex-col items-center text-center">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-red/50 transition-all duration-500" />
                
                <div className="w-14 h-14 rounded-2xl bg-bg border border-white/5 flex items-center justify-center text-text-muted group-hover:text-bg group-hover:bg-red group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-xl mb-6 relative">
                  <div className="absolute inset-0 bg-red/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <item.icon className="w-6 h-6 relative z-10" />
                </div>
                
                <h4 className="font-display font-bold text-xl text-text-white mb-3 group-hover:text-red transition-colors duration-300">{item.title}</h4>
                <p className="text-sm text-text-muted leading-relaxed flex-grow">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
