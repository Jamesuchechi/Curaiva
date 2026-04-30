"use client"

import * as React from "react"
import { UserRole } from "@/types"

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface PageContext {
  /** Raw data snippets the AI should know about the current view */
  medications?: { name: string; dose: string; time: string; status: string }[]
  moodToday?: number | null
  moodWeek?: (number | null)[]
  adherencePct?: number
  recentActivity?: string[]
  consultationCount?: number
  
  /** Sub-page specific contexts */
  activeMedications?: { name: string; dose: string; time: string; status: string }[]
  avgAdherence?: number
  unloggedMeds?: string[]
  
  avgMoodScore7Days?: number
  recentMoodLogs?: string[]
  activeStreak?: number
  
  openConsultations?: number
  recentConsultationSummary?: string
  recentConsultationStatus?: string
  
  /** Free-form extra context string (e.g. for doctor/CHW pages) */
  extra?: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  /** True while streaming is in progress for this message */
  streaming?: boolean
}

interface AIPanelContextType {
  isOpen: boolean
  open: (initialPrompt?: string) => void
  close: () => void
  toggle: () => void
  /** Call from any page to push context into the panel */
  setPageContext: (ctx: PageContext) => void
  pageContext: PageContext | null
  currentPage: string
  setCurrentPage: (page: string) => void
  role: UserRole
  setRole: (role: UserRole) => void
  language: string
  setLanguage: (lang: string) => void
  messages: ChatMessage[]
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => string
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void
  clearMessages: () => void
  pendingPrompt: string | null
  clearPendingPrompt: () => void
}

/* ─── Context ────────────────────────────────────────────────────────────── */

const AIPanelContext = React.createContext<AIPanelContextType | undefined>(undefined)

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hello! I'm **Curaiva AI**, your clinical intelligence assistant. I'm aware of your current page and health data — ask me anything, from checking your medications to understanding a symptom.",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
}

function makeId() {
  return Math.random().toString(36).substring(2, 9)
}

/* ─── Provider ───────────────────────────────────────────────────────────── */

export function AIPanelProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [pageContext, setPageContextState] = React.useState<PageContext | null>(null)
  const [currentPage, setCurrentPage] = React.useState("Dashboard")
  const [role, setRole] = React.useState<UserRole>("patient")
  const [language, setLanguage] = React.useState("English")
  const [messages, setMessages] = React.useState<ChatMessage[]>([WELCOME])
  const [pendingPrompt, setPendingPrompt] = React.useState<string | null>(null)

  const open = React.useCallback((initialPrompt?: string) => {
    setIsOpen(true)
    if (initialPrompt) setPendingPrompt(initialPrompt)
  }, [])

  const close = React.useCallback(() => setIsOpen(false), [])
  const toggle = React.useCallback(() => setIsOpen(v => !v), [])

  const setPageContext = React.useCallback((ctx: PageContext) => {
    setPageContextState(ctx)
  }, [])

  const addMessage = React.useCallback(
    (msg: Omit<ChatMessage, "id" | "timestamp">): string => {
      const id = makeId()
      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      setMessages(prev => [...prev, { ...msg, id, timestamp }])
      return id
    },
    []
  )

  const updateMessage = React.useCallback(
    (id: string, updates: Partial<ChatMessage>) => {
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)))
    },
    []
  )

  const clearMessages = React.useCallback(() => {
    setMessages([WELCOME])
  }, [])

  const clearPendingPrompt = React.useCallback(() => {
    setPendingPrompt(null)
  }, [])

  const value: AIPanelContextType = {
    isOpen,
    open,
    close,
    toggle,
    setPageContext,
    pageContext,
    currentPage,
    setCurrentPage,
    role,
    setRole,
    language,
    setLanguage,
    messages,
    addMessage,
    updateMessage,
    clearMessages,
    pendingPrompt,
    clearPendingPrompt,
  }

  return <AIPanelContext.Provider value={value}>{children}</AIPanelContext.Provider>
}

/* ─── Hook ───────────────────────────────────────────────────────────────── */

export function useAIPanel() {
  const ctx = React.useContext(AIPanelContext)
  if (!ctx) throw new Error("useAIPanel must be used within AIPanelProvider")
  return ctx
}
