"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  X,
  Send,
  Trash2,
  Sparkles,
  ChevronDown,
  Pill,
  Smile,
  Calendar,
  Activity,
  Stethoscope,
  Users,
  RefreshCw,
  Mic,
  Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAIPanel, type ChatMessage, type PageContext } from "@/components/providers/ai-panel-provider"
import { UserRole } from "@/types"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase"

/* ─── Quick Actions ─────────────────────────────────────────────────────── */

interface QuickAction {
  label: string
  prompt: string
  icon: React.ReactNode
}

function getQuickActions(role: UserRole, page: string): QuickAction[] {
  if (role === "patient") {
    if (page.toLowerCase().includes("medication")) {
      return [
        { label: "What's my next dose?", prompt: "What medication do I need to take next?", icon: <Pill className="w-3 h-3" /> },
        { label: "Side effect help", prompt: "I'm experiencing some side effects from my medication, can you help?", icon: <Activity className="w-3 h-3" /> },
        { label: "Log a missed dose", prompt: "I missed a dose, what should I do?", icon: <RefreshCw className="w-3 h-3" /> },
      ]
    }
    if (page.toLowerCase().includes("mental")) {
      return [
        { label: "I need to talk", prompt: "I'm feeling overwhelmed today and need some support.", icon: <Smile className="w-3 h-3" /> },
        { label: "Breathing exercise", prompt: "Can you guide me through a quick breathing exercise?", icon: <Activity className="w-3 h-3" /> },
        { label: "Log my mood", prompt: "Help me reflect on how I'm feeling today.", icon: <Smile className="w-3 h-3" /> },
      ]
    }
    // Default patient actions
    return [
      { label: "Check my meds", prompt: "Can you check my medication schedule for today?", icon: <Pill className="w-3 h-3" /> },
      { label: "How am I doing?", prompt: "Give me a summary of my health status today.", icon: <Activity className="w-3 h-3" /> },
      { label: "Book a consult", prompt: "I'd like to request a consultation with a doctor.", icon: <Calendar className="w-3 h-3" /> },
    ]
  }

  if (role === "doctor") {
    return [
      { label: "Patient queue", prompt: "Give me an overview of today's patient queue.", icon: <Users className="w-3 h-3" /> },
      { label: "Urgent cases", prompt: "Are there any critical or urgent patients I need to see now?", icon: <Activity className="w-3 h-3" /> },
      { label: "Generate brief", prompt: "Generate a pre-consultation brief for my next patient.", icon: <Stethoscope className="w-3 h-3" /> },
    ]
  }

  // CHW
  return [
    { label: "Community status", prompt: "What's the health status of my community today?", icon: <Users className="w-3 h-3" /> },
    { label: "High-risk patients", prompt: "Show me the highest-risk patients in my area.", icon: <Activity className="w-3 h-3" /> },
    { label: "Visit schedule", prompt: "What home visits do I have scheduled today?", icon: <Calendar className="w-3 h-3" /> },
  ]
}

/* ─── Message Bubble ────────────────────────────────────────────────────── */

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAI = message.role === "assistant"

  // Render markdown-like bold: **text**
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold text-text-white">{part.slice(2, -2)}</strong>
      }
      // Handle newlines
      return part.split("\n").map((line, j) => (
        <React.Fragment key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </React.Fragment>
      ))
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex gap-2.5",
        isAI ? "justify-start" : "justify-end"
      )}
    >
      {isAI && (
        <div className="w-7 h-7 rounded-full bg-linear-to-br from-brand-lime/30 to-teal/30 border border-brand-lime/30 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-lime" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isAI
            ? "bg-surface border border-border-base text-text-light rounded-tl-sm"
            : "bg-brand-lime text-bg font-medium rounded-tr-sm"
        )}
      >
        {message.streaming ? (
          <span>
            {renderContent(message.content)}
            <span className="inline-block w-0.5 h-4 bg-brand-lime ml-0.5 animate-pulse align-text-bottom" />
          </span>
        ) : (
          renderContent(message.content)
        )}
      </div>
    </motion.div>
  )
}

/* ─── Context Badge ─────────────────────────────────────────────────────── */

function ContextBadge({ page, ctx }: { page: string; ctx: PageContext | null }) {
  const [expanded, setExpanded] = React.useState(false)

  if (!ctx) return null

  const items: string[] = []
  if (ctx.adherencePct !== undefined) items.push(`${ctx.adherencePct}% adherence`)
  if (ctx.moodToday) items.push(`Mood: ${ctx.moodToday}/10`)
  if (ctx.consultationCount !== undefined) items.push(`${ctx.consultationCount} consultations`)
  if (ctx.medications?.length) items.push(`${ctx.medications.length} active meds`)

  if (!items.length) return null

  return (
    <button
      onClick={() => setExpanded(v => !v)}
      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-teal/5 border border-teal/20 text-[10px] font-mono text-teal hover:bg-teal/10 transition-colors"
    >
      <span className="flex items-center gap-1.5">
        <Activity className="w-3 h-3" />
        Context: {page} · {items.length} signals loaded
      </span>
      <ChevronDown className={cn("w-3 h-3 transition-transform", expanded && "rotate-180")} />
    </button>
  )
}

/* ─── Typing Indicator ──────────────────────────────────────────────────── */

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex items-center gap-2.5"
    >
      <div className="w-7 h-7 rounded-full bg-linear-to-br from-brand-lime/30 to-teal/30 border border-brand-lime/30 flex items-center justify-center shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-brand-lime animate-pulse" />
      </div>
      <div className="bg-surface border border-border-base rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-text-muted"
            style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Role Indicator ────────────────────────────────────────────────────── */

const ROLE_LABELS: Record<UserRole, { label: string; color: string }> = {
  patient: { label: "Patient Mode", color: "text-brand-lime" },
  doctor: { label: "Physician Mode", color: "text-teal" },
  chw: { label: "CHW Mode", color: "text-purple" },
}

/* ─── Main Panel ────────────────────────────────────────────────────────── */

export function AIPanel() {
  const {
    isOpen,
    close,
    messages,
    addMessage,
    updateMessage,
    clearMessages,
    pageContext,
    currentPage,
    role,
    language,
    setLanguage,
    pendingPrompt,
    clearPendingPrompt,
  } = useAIPanel()

  const [input, setInput] = React.useState("")
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [isListening, setIsListening] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const quickActions = getQuickActions(role, currentPage)
  const roleInfo = ROLE_LABELS[role]
  const LANGUAGES = ["English", "Swahili", "Hausa", "Yoruba", "Igbo", "French"]
  
  const { profile } = useAuth()
  const supabase = React.useMemo(() => createClient(), [])

  interface AIAction {
    action: "LOG_MEDICATION" | "CREATE_CONSULTATION"
    medication_name?: string
  }

  const executeAction = async (data: AIAction) => {
    if (!profile?.id) return
    
    if (data.action === "LOG_MEDICATION" && data.medication_name) {
      const { data: meds } = await supabase.from("medications")
        .select("id").eq("patient_id", profile.id)
        .ilike("name", `%${data.medication_name}%`).limit(1)
        
      if (meds && meds[0]) {
        await supabase.from("medication_logs").insert({
          medication_id: meds[0].id,
          patient_id: profile.id,
          status: "taken"
        })
      }
    } else if (data.action === "CREATE_CONSULTATION") {
      await supabase.from("consultations").insert({
        patient_id: profile.id,
        status: "open",
        severity: "moderate",
        ai_summary: "Patient requested a consultation via the AI Assistant."
      })
    }
  }

  // Speech Recognition setup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = React.useRef<any>(null)
  React.useEffect(() => {
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        
        recognitionRef.current.onresult = (event: { resultIndex: number; results: { isFinal: boolean; [key: number]: { transcript: string } }[] }) => {
          let finalTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          
          if (finalTranscript) {
            setInput(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + finalTranscript)
          }
        }
        
        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }
  }, [])

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      try {
        // Set language for recognition based on selected language
        const langCode = language === "French" ? "fr-FR" : language === "Swahili" ? "sw-KE" : language === "Igbo" ? "ig-NG" : "en-US"
        if (recognitionRef.current) recognitionRef.current.lang = langCode
        recognitionRef.current?.start()
        setIsListening(true)
      } catch {
        setIsListening(false)
      }
    }
  }

  // Auto-scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when panel opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Handle pending prompt from external open() calls
  React.useEffect(() => {
    if (isOpen && pendingPrompt) {
      clearPendingPrompt()
      handleSend(pendingPrompt)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pendingPrompt])

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim()
    if (!text || isStreaming) return
    setInput("")

    addMessage({ role: "user", content: text })

    setIsStreaming(true)
    const assistantId = addMessage({
      role: "assistant",
      content: "",
      streaming: true,
    })

    try {
      // Build the messages history for the API (last 20 messages)
      const history = messages
        .filter(m => !m.streaming && m.id !== "welcome")
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: text }],
          context: {
            role,
            currentPage,
            pageContext,
            language
          },
        }),
      })

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }

      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (data === "[DONE]") break
            try {
              const parsed = JSON.parse(data)
              if (parsed.token) {
                accumulated += parsed.token
                updateMessage(assistantId, { content: accumulated, streaming: true })
              }
            } catch {
              // ignore parse errors in stream
            }
          }
        }
      }

      // Check for Tool Calling Actions
      const match = accumulated.match(/```json\n({"action":[\s\S]*?})\n```/) || accumulated.match(/({"action":[\s\S]*?})/)
      if (match) {
        try {
          const actionData = JSON.parse(match[1])
          await executeAction(actionData)
          accumulated = accumulated.replace(match[0], "\n\n*(✨ Executed action automatically)*\n\n")
          window.dispatchEvent(new Event("curaiva-refresh-data"))
        } catch (e) {
          console.error("Failed to parse AI action", e)
        }
      }

      updateMessage(assistantId, { content: accumulated, streaming: false })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong"
      updateMessage(assistantId, {
        content: `I'm sorry, I encountered an error: ${msg}. Please try again.`,
        streaming: false,
      })
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="ai-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-bg/50 backdrop-blur-[2px] z-40"
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="ai-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full z-50 flex flex-col"
            style={{
              width: "clamp(380px, 30vw, 520px)",
              background: "var(--bg)",
              borderLeft: "1px solid var(--border)",
              boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div
              className="shrink-0 px-4 py-3 border-b border-border-base flex items-center justify-between"
              style={{ background: "var(--surface)" }}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-xl bg-linear-to-br from-brand-lime/20 to-teal/20 border border-brand-lime/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-brand-lime" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-lime rounded-full border-2 border-bg" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-sm text-text-white">Curaiva AI</h3>
                    <span className={cn("text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-surface-2", roleInfo.color)}>
                      {roleInfo.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted font-mono mt-0.5">
                    Page: {currentPage}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="relative group mr-2">
                  <button className="flex items-center gap-1 p-1.5 rounded-lg text-text-muted hover:text-text-white hover:bg-surface-2 transition-colors text-xs font-medium">
                    <Globe className="w-3.5 h-3.5" />
                    {language.substring(0, 2).toUpperCase()}
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-28 bg-surface border border-border-base rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                    {LANGUAGES.map(lang => (
                      <button key={lang} onClick={() => setLanguage(lang)} className={cn("w-full text-left px-3 py-2 text-xs transition-colors", language === lang ? "bg-brand-lime/10 text-brand-lime font-bold" : "text-text-light hover:bg-surface-2")}>
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={clearMessages}
                  title="Clear conversation"
                  className="p-2 rounded-lg text-text-muted hover:text-text-light hover:bg-surface-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={close}
                  className="p-2 rounded-lg text-text-muted hover:text-text-white hover:bg-surface-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Context Badge */}
            <div className="shrink-0 px-4 pt-3">
              <ContextBadge page={currentPage} ctx={pageContext} />
            </div>

            {/* Quick Actions */}
            <div className="shrink-0 px-4 pt-3 pb-1">
              <div className="flex flex-wrap gap-1.5">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(action.prompt)}
                    disabled={isStreaming}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-surface border border-border-base text-text-muted hover:border-brand-lime/40 hover:text-brand-lime hover:bg-brand-lime/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="shrink-0 mx-4 mt-3 border-t border-border-base" />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
              <div className="text-[10px] text-center text-text-muted font-mono uppercase tracking-widest mb-2">
                Session started · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>

              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              <AnimatePresence>
                {isStreaming && messages[messages.length - 1]?.content === "" && (
                  <TypingIndicator />
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-border-base p-4" style={{ background: "var(--surface)" }}>
              <div className="flex items-center gap-2 bg-bg rounded-xl border border-border-base focus-within:border-brand-lime/50 transition-colors px-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isStreaming}
                  placeholder={isListening ? "Listening..." : (isStreaming ? "Curaiva is thinking..." : `Ask anything in ${language}...`)}
                  className="flex-1 h-12 bg-transparent text-sm text-text-light placeholder:text-text-muted outline-none disabled:cursor-not-allowed"
                />
                <Button
                  onClick={toggleListen}
                  variant="ghost"
                  size="icon"
                  className={cn("h-8 w-8 shrink-0 rounded-full transition-all", isListening ? "bg-red/10 text-red hover:bg-red/20 animate-pulse" : "text-text-muted hover:text-text-white")}
                >
                  <Mic className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleSend()}
                  disabled={isStreaming || !input.trim()}
                  size="icon"
                  className="h-8 w-8 shrink-0 bg-brand-lime text-bg hover:opacity-90 disabled:opacity-40 rounded-full"
                >
                  <Send className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              </div>
              <p className="text-[9px] text-center text-text-muted mt-2 font-mono">
                Not a substitute for professional medical advice · Powered by Groq
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bounce keyframe injection */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  )
}
