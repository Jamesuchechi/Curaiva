"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { 
  FileText, 
  Stethoscope, 
  ClipboardList, 
  Pill, 
  LineChart, 
  AlertCircle 
} from "lucide-react"
import { cn } from "@/lib/utils"

const tools = [
  {
    icon: FileText,
    name: "Patient Summary",
    desc: "Synthesize full medical history into a concise clinician-ready snapshot.",
    tags: ["FHIR", "Patient", "Condition"]
  },
  {
    icon: Stethoscope,
    name: "Triage Analysis",
    desc: "AI-driven symptom analysis with severity scoring and red-flag detection.",
    tags: ["AI", "Clinical", "Triage"]
  },
  {
    icon: ClipboardList,
    name: "Generate Brief",
    desc: "Pre-consultation clinical briefs automatically generated from patient records.",
    tags: ["Automation", "MCP", "SHARP"]
  },
  {
    icon: Pill,
    name: "Drug Interactions",
    desc: "Real-time verification of drug-drug and drug-condition contraindications.",
    tags: ["Safety", "Medication"]
  },
  {
    icon: LineChart,
    name: "Analyze Vitals",
    desc: "Pattern recognition in vital signs to detect early physiological decline.",
    tags: ["Observation", "Trends"]
  },
  {
    icon: AlertCircle,
    name: "Escalate Care",
    desc: "Automated routing of high-risk cases to available clinical specialists.",
    tags: ["Critical", "Workflow"]
  }
]

export function Features() {
  return (
    <section id="tools" className="py-32 bg-bg relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-px bg-gradient-to-r from-transparent via-brand-lime/20 to-transparent" />
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-brand-lime/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-teal/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container px-6 relative z-10">
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-lime/10 border border-brand-lime/20 text-brand-lime text-xs font-mono font-bold tracking-widest uppercase mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-lime"></span>
            </span>
            Intelligence Toolset
          </div>
          <h2 className="text-5xl md:text-6xl font-display font-black text-text-white mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
            Clinical power, <br className="hidden md:block" />
            <em className="font-light italic text-transparent bg-clip-text bg-gradient-to-r from-brand-lime to-teal">automated</em>.
          </h2>
          <p className="text-text-muted text-lg leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            Six purpose-built clinical tools designed to augment health workers and empower patients using standardized medical data.
          </p>
        </div>

        {/* Centered Grid for Cards */}
        <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
          {tools.map((tool, i) => {
            return (
              <div 
                key={tool.name} 
                className="group relative w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.33rem)] animate-in fade-in zoom-in-95 duration-1000"
                style={{ animationDelay: `${200 + i * 100}ms`, animationFillMode: 'both' }}
              >
                {/* Glow effect on hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-lime/0 via-brand-lime/30 to-teal/0 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none" />
                
                <Card className="relative h-full bg-surface-2/40 backdrop-blur-xl border border-white/5 group-hover:border-brand-lime/30 transition-all duration-500 overflow-hidden rounded-2xl flex flex-col">
                  {/* Subtle top border gradient */}
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-brand-lime/50 transition-all duration-500" />
                  
                  <CardContent className="p-8 flex flex-col items-center text-center h-full">
                    <div className="w-16 h-16 rounded-2xl bg-bg border border-white/5 flex items-center justify-center text-brand-lime group-hover:text-bg group-hover:bg-brand-lime group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl mb-6 relative">
                      <div className="absolute inset-0 bg-brand-lime/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <tool.icon className="w-8 h-8 relative z-10" />
                    </div>
                    
                    <h4 className="font-display font-bold text-xl text-text-white mb-4 group-hover:text-brand-lime transition-colors duration-300">
                      {tool.name}
                    </h4>
                    
                    <p className="text-sm text-text-muted leading-relaxed mb-8 flex-grow">
                      {tool.desc}
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-2 mt-auto">
                      {tool.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-surface border border-white/5 text-text-muted group-hover:border-brand-lime/20 group-hover:text-brand-lime/80 transition-colors duration-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
