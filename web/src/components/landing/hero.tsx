"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Activity, ShieldCheck, Zap } from "lucide-react"
import { VisualBackground } from "./visual-background"

export function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center pt-24 overflow-hidden bg-bg">
      <VisualBackground />
      
      {/* Deep Mesh Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-lime/10 blur-[150px] rounded-full opacity-60 mix-blend-screen" />
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] bg-teal/10 blur-[120px] rounded-full opacity-40 mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-purple/10 blur-[150px] rounded-full opacity-30 mix-blend-screen" />
      </div>

      {/* Decorative Floating Elements */}
      <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block overflow-hidden perspective-[1000px]">
        {/* Float Card 1 */}
        <div className="absolute top-[25%] left-[10%] w-48 p-4 rounded-2xl bg-surface/40 backdrop-blur-md border border-white/10 shadow-2xl animate-in fade-in slide-in-from-left-20 duration-1000 delay-500 animate-[float_6s_ease-in-out_infinite]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-teal/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-teal" />
            </div>
            <div className="text-[10px] font-mono font-bold text-teal uppercase">Vitals Sync</div>
          </div>
          <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full w-[75%] bg-teal animate-pulse" />
          </div>
        </div>

        {/* Float Card 2 */}
        <div className="absolute top-[45%] right-[10%] w-56 p-4 rounded-2xl bg-surface/40 backdrop-blur-md border border-white/10 shadow-2xl animate-in fade-in slide-in-from-right-20 duration-1000 delay-700 animate-[float_8s_ease-in-out_infinite_reverse]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-lime/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-brand-lime" />
            </div>
            <div className="text-[10px] font-mono font-bold text-brand-lime uppercase">SHARP Verification</div>
          </div>
          <div className="flex justify-between items-end">
            <div className="text-2xl font-display font-black text-white">100%</div>
            <div className="text-[10px] text-text-muted font-mono mb-1">Encrypted</div>
          </div>
        </div>
      </div>
      
      <div className="container relative z-10 px-6 text-center mt-10">
        <div className="flex justify-center mb-10">
          <div className="px-5 py-2.5 rounded-full bg-surface-2/60 backdrop-blur-md border border-white/10 flex items-center gap-4 animate-in fade-in slide-in-from-top-8 duration-1000 shadow-xl group cursor-pointer hover:border-brand-lime/30 transition-colors">
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-lime shadow-[0_0_8px_rgba(132,204,22,0.8)] animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-brand-lime/50 animate-pulse [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-brand-lime/20 animate-pulse [animation-delay:0.4s]" />
            </div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-text-white group-hover:text-brand-lime transition-colors">
              Agents Assemble Hackathon
            </span>
            <ArrowRight className="w-3 h-3 text-brand-lime opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-[7.5rem] font-display font-black text-text-white mb-8 leading-[0.9] tracking-tighter animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          Clinical AI with <br />
          <span className="relative inline-block">
            <span className="absolute -inset-1 bg-brand-lime/20 blur-2xl rounded-full" />
            <em className="relative text-transparent bg-clip-text bg-linear-to-r from-brand-lime via-teal to-brand-lime font-light italic bg-[length:200%_auto] animate-[gradient_8s_linear_infinite]">zero</em>
          </span> friction.
        </h1>

        <p className="max-w-2xl mx-auto text-text-muted text-lg md:text-xl leading-relaxed mb-14 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          Curaiva bridges medical silos using Claude MCP. Real-time FHIR analysis, 
          SHARP-certified safety, and cross-agent COIN orchestration directly in the browser.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
          <Link href="/login">
            <Button size="lg" className="bg-brand-lime text-bg font-black text-lg h-16 px-12 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(132,204,22,0.25)] hover:shadow-[0_0_60px_rgba(132,204,22,0.4)] relative group overflow-hidden">
              <span className="relative z-10 flex items-center">Launch Terminal <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            </Button>
          </Link>
          <Link href="#architecture">
            <Button variant="ghost" size="lg" className="h-16 px-12 rounded-2xl text-text-white border border-white/10 bg-surface-2/50 backdrop-blur-md hover:bg-surface hover:border-white/20 transition-all font-bold text-lg">
              Explore Docs
            </Button>
          </Link>
        </div>

        {/* Industry Trust Bar */}
        <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8 pt-12 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
          <div className="flex items-center gap-3 text-text-muted hover:text-white transition-colors cursor-default group">
            <ShieldCheck className="w-6 h-6 text-brand-lime group-hover:scale-110 transition-transform" />
            <span className="font-mono text-xs font-bold tracking-widest uppercase">SHARP Protocol</span>
          </div>
          <div className="flex items-center gap-3 text-text-muted hover:text-white transition-colors cursor-default group">
            <Activity className="w-6 h-6 text-teal group-hover:scale-110 transition-transform" />
            <span className="font-mono text-xs font-bold tracking-widest uppercase">FHIR R4 Native</span>
          </div>
          <div className="flex items-center gap-3 text-text-muted hover:text-white transition-colors cursor-default group">
            <Zap className="w-6 h-6 text-amber group-hover:scale-110 transition-transform" />
            <span className="font-mono text-xs font-bold tracking-widest uppercase">MCP Certified</span>
          </div>
        </div>
      </div>
    </section>
  )
}
