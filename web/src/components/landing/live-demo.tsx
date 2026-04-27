"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Zap, Terminal, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Message {
  role: 'user' | 'agent' | 'tool'
  text?: string
  fn?: string
  status?: string
  args?: string
  result?: string
}

export function LiveDemo() {
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'agent', text: "I can help with clinical intelligence tasks. Try asking me to triage a patient, prepare a pre-consultation brief, or run a medication adherence check." }
  ])
  const [inputValue, setInputValue] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  const chatEndRef = React.useRef<HTMLDivElement>(null)

  const responses: Record<string, Message[]> = {
    triage: [
      { role: 'tool', fn: 'triage_patient()', status: '200 OK', args: 'patient_id: 592903 · symptoms: chest pain', result: 'severity: critical · score: 9/10 · escalate: true' },
      { role: 'agent', text: "Triage complete. Severity: CRITICAL (9/10). I've detected symptoms consistent with acute cardiac distress. I've automatically escalated this to the Doctor on duty and emitted a clinical_brief_ready intent via COIN." }
    ],
    summary: [
      { role: 'tool', fn: 'get_patient_summary()', status: '200 OK', args: 'patient_id: 592903', result: '5 FHIR resources fetched · summary generated' },
      { role: 'agent', text: "Patient Summary for Amara Osei (592903): 41-year-old female with chronic hypertension and T2DM. Latest BP: 158/98. Medications: Metformin, Lisinopril. High risk for non-adherence detected based on recent prescription refill gaps." }
    ]
  }

  const handleSend = () => {
    if (!inputValue.trim() || isTyping) return
    
    const userMsg: Message = { role: 'user', text: inputValue }
    setMessages(prev => [...prev, userMsg])
    const currentInput = inputValue.toLowerCase()
    setInputValue("")
    setIsTyping(true)

    setTimeout(() => {
      const key = currentInput.includes('triage') || currentInput.includes('pain') ? 'triage' : 'summary'
      const res = responses[key]
      
      res.forEach((msg, i) => {
        setTimeout(() => {
          setMessages(prev => [...prev, msg])
          if (i === res.length - 1) setIsTyping(false)
        }, i * 800)
      })
    }, 1200)
  }

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <section id="demo" className="py-24 bg-bg relative">
      <div className="container px-6">
        <div className="text-center mb-16">
          <p className="text-[10px] font-mono font-bold text-brand-lime uppercase tracking-[0.2em] mb-4">
            Live Agent Capability
          </p>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-text-white mb-6">
            See the agent in <em className="font-light italic text-brand-lime">action</em>.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
          {/* Agent Window */}
          <div className="lg:col-span-7 flex flex-col h-[600px] rounded-3xl bg-surface/30 border border-border-base overflow-hidden backdrop-blur-xl shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 bg-surface-2/50 border-b border-border-base flex items-center justify-between">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-brand-lime/40" />
              </div>
              <div className="text-[10px] font-mono text-text-muted font-bold tracking-widest uppercase">
                Prompt Opinion Agent Interface
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-teal font-bold uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                Live
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={cn(
                  "flex flex-col gap-1.5 animate-in slide-in-from-bottom-2 duration-300",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}>
                  <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest px-1">
                    {msg.role === 'tool' ? 'MCP Tool Call' : msg.role === 'agent' ? 'Curaiva AI' : 'Clinician'}
                  </span>
                  
                  {msg.role === 'tool' ? (
                    <div className="w-full bg-bg border border-brand-lime/20 rounded-xl p-4 font-mono text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-brand-lime font-bold">{msg.fn}</span>
                        <span className="bg-teal/10 text-teal px-1.5 py-0.5 rounded text-[10px]">{msg.status}</span>
                      </div>
                      <div className="text-text-muted mb-2">{msg.args}</div>
                      <div className="text-teal">→ {msg.result}</div>
                    </div>
                  ) : (
                    <div className={cn(
                      "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-brand-lime text-bg font-semibold rounded-tr-none" 
                        : "bg-surface-2 border border-border-base text-text-light rounded-tl-none"
                    )}>
                      {msg.text}
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-text-muted font-mono text-[10px] uppercase tracking-widest px-1">
                  Agent is calling MCP tools
                  <span className="flex gap-1">
                    <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce [animation-delay:0.4s]" />
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-surface-2/30 border-t border-border-base">
              <div className="relative">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Curaiva to triage patient 592903..."
                  className="w-full h-12 pl-4 pr-12 rounded-xl bg-bg border border-border-base focus:border-brand-lime outline-none transition-all text-sm"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-2 top-2 w-8 h-8 rounded-lg bg-brand-lime text-bg flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <Zap className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          </div>

          {/* Inspector Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-surface/30 border border-border-base backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-mono font-bold text-text-white uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-brand-lime" /> Tool Inspector
                </h4>
                <Badge variant="new">A2A Protocol</Badge>
              </div>

              {/* Inspector Card 1 */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-bg border border-border-base space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-text-muted uppercase font-bold">SHARP Context</span>
                    <span className="text-[10px] font-mono text-brand-lime uppercase">Propagated</span>
                  </div>
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between"><span className="text-text-muted">fhir_base_url</span><span className="text-text-white">hapi.fhir.org/baseR4</span></div>
                    <div className="flex justify-between"><span className="text-text-muted">patient_id</span><span className="text-brand-lime">592903</span></div>
                    <div className="flex justify-between"><span className="text-text-muted">practitioner_id</span><span className="text-text-white">PRAC-044</span></div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-bg border border-border-base space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-text-muted uppercase font-bold">COIN Intents</span>
                    <span className="text-[10px] font-mono text-teal uppercase">Emitted</span>
                  </div>
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between"><span className="text-text-muted">intent</span><span className="text-teal">triage_result</span></div>
                    <div className="flex justify-between"><span className="text-text-muted">severity</span><span className="text-red">critical</span></div>
                    <div className="flex justify-between"><span className="text-text-muted">escalate</span><span className="text-red">true</span></div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-brand-lime/5 border border-brand-lime/20 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-lime" />
                  <p className="text-xs text-brand-lime font-bold">Trust Score: 0.98 (Clinically Validated)</p>
                </div>
              </div>
            </div>

            {/* Metrics Mini-Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-surface/30 border border-border-base backdrop-blur-xl text-center">
                <p className="text-2xl font-display font-bold text-text-white">1.84s</p>
                <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mt-1">Avg Latency</p>
              </div>
              <div className="p-6 rounded-3xl bg-surface/30 border border-border-base backdrop-blur-xl text-center">
                <p className="text-2xl font-display font-bold text-text-white">100%</p>
                <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mt-1">FHIR Native</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
