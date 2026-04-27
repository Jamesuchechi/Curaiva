import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ShieldCheck, Activity, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="bg-bg relative overflow-hidden border-t border-white/5">
      {/* Top CTA Section */}
      <div className="py-24 relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-lime/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="container px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-black text-text-white mb-6">
            Ready to upgrade <br />
            <em className="font-light italic text-transparent bg-clip-text bg-linear-to-r from-brand-lime to-teal">clinical intelligence?</em>
          </h2>
          <p className="text-text-muted max-w-xl mx-auto mb-10 text-lg">
            Join the Agents Assemble ecosystem and start orchestrating secure, real-time medical workflows today.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-brand-lime text-bg font-bold h-14 px-10 rounded-xl hover:scale-105 transition-all shadow-[0_0_40px_rgba(132,204,22,0.2)] hover:shadow-[0_0_60px_rgba(132,204,22,0.4)]">
              Launch Terminal <ArrowRight className="ml-3 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="border-t border-white/5 bg-surface/30 backdrop-blur-xl relative z-10 pt-16 pb-8">
        <div className="container px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-white/10 shadow-lg p-2">
                  <div className="absolute inset-0 bg-brand-lime/10 blur-md rounded-xl" />
                  <Image src="/logo.png" alt="Curaiva Logo" width={24} height={24} className="object-contain relative z-10" />
                </div>
                <span className="font-display font-black text-2xl text-text-white tracking-tight">Curaiva</span>
              </div>
              <p className="text-text-muted text-sm leading-relaxed max-w-sm mb-8">
                The SHARP-certified clinical intelligence layer for the MCP hackathon. Bridging data silos with zero friction.
              </p>
              <div className="flex items-center gap-4 text-text-muted">
                 <ShieldCheck className="w-5 h-5 hover:text-brand-lime transition-colors cursor-pointer" />
                 <Activity className="w-5 h-5 hover:text-teal transition-colors cursor-pointer" />
                 <Zap className="w-5 h-5 hover:text-amber transition-colors cursor-pointer" />
              </div>
            </div>

            <div>
              <h4 className="font-mono text-xs font-bold text-text-white uppercase tracking-widest mb-6">Platform</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-sm text-text-muted hover:text-brand-lime transition-colors">Intelligence Hub</Link></li>
                <li><Link href="#" className="text-sm text-text-muted hover:text-brand-lime transition-colors">SHARP Protocol</Link></li>
                <li><Link href="#" className="text-sm text-text-muted hover:text-brand-lime transition-colors">FHIR Integration</Link></li>
                <li><Link href="#" className="text-sm text-text-muted hover:text-brand-lime transition-colors">COIN Intents</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs font-bold text-text-white uppercase tracking-widest mb-6">Resources</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-sm text-text-muted hover:text-brand-lime transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-sm text-text-muted hover:text-brand-lime transition-colors">API Reference</Link></li>
                <li><Link href="#" className="text-sm text-text-muted hover:text-brand-lime transition-colors">Security Whitepaper</Link></li>
                <li><Link href="#" className="text-sm text-text-muted hover:text-brand-lime transition-colors">GitHub Repository</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-text-muted font-mono tracking-wider">
              © 2026 AGENTS ASSEMBLE · MCP HACKATHON
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-[11px] font-mono font-bold uppercase tracking-widest text-text-muted hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="text-[11px] font-mono font-bold uppercase tracking-widest text-text-muted hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
