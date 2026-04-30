import { NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { UserRole } from "@/types"

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface PageContext {
  medications?: { name: string; dose: string; time: string; status: string }[]
  moodToday?: number | null
  moodWeek?: (number | null)[]
  adherencePct?: number
  recentActivity?: string[]
  consultationCount?: number
  extra?: string
}

interface ChatContext {
  role: UserRole
  currentPage: string
  pageContext?: PageContext | null
  language?: string
}

interface IncomingMessage {
  role: "user" | "assistant"
  content: string
}

/* ─── System Prompt Builder ─────────────────────────────────────────────── */

function buildSystemPrompt(ctx: ChatContext, userName?: string): string {
  const name = userName ?? "the user"
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

  const roleInstructions: Record<UserRole, string> = {
    patient: `You are helping ${name}, a patient using the Curaiva telemedicine platform.
- Be warm, empathetic, and use clear plain language (avoid medical jargon unless they use it first).
- Help them understand their health data, medications, and when to seek care.
- NEVER diagnose. You can triage, inform, and recommend they see a doctor.
- Encourage medication adherence positively, never scolding.
- If they describe serious symptoms (chest pain, difficulty breathing, severe pain), urge them to seek emergency care immediately.`,

    doctor: `You are assisting Dr. ${name}, a physician on the Curaiva platform.
- Use clinical language. Be concise and precise.
- Help them review patient data, generate consultation briefs, and manage their patient queue.
- Surface relevant clinical insights from the patient data context.
- You can suggest differential diagnoses and treatment considerations.`,

    chw: `You are assisting ${name}, a Community Health Worker (CHW) on the Curaiva platform.
- Help them prioritize patient visits, identify high-risk community members, and log observations.
- Use practical, field-oriented language.
- Help them understand when to escalate a patient to a doctor.`,
  }

  let contextSection = ""
  const p = ctx.pageContext

  if (p) {
    contextSection = "\n\n## Current Dashboard Data (loaded from user's live records):"

    if (p.medications?.length) {
      const medLines = p.medications.map(m => `  - ${m.name} ${m.dose} at ${m.time} — status: ${m.status}`).join("\n")
      contextSection += `\n### Today's Medications:\n${medLines}`
    }

    if (p.adherencePct !== undefined) {
      contextSection += `\n### Medication Adherence: ${p.adherencePct}% today`
    }

    if (p.moodToday != null) {
      contextSection += `\n### Mood Score (today): ${p.moodToday}/10`
    }

    if (p.consultationCount !== undefined) {
      contextSection += `\n### Active Consultations: ${p.consultationCount}`
    }

    if (p.recentActivity?.length) {
      contextSection += `\n### Recent Activity:\n${p.recentActivity.map(a => `  - ${a}`).join("\n")}`
    }

    if (p.extra) {
      contextSection += `\n### Additional Context:\n${p.extra}`
    }
  }

  return `You are Curaiva AI, a clinical intelligence assistant embedded in a telemedicine platform serving patients, doctors, and community health workers primarily in sub-Saharan Africa.

Today is ${today}.
The user is currently on: "${ctx.currentPage}" page.

CRITICAL LANGUAGE REQUIREMENT:
You MUST respond entirely in ${ctx.language || "English"}. Do not use English unless the user's language is set to English.

${roleInstructions[ctx.role]}

## General Guidelines:
- Keep responses focused and appropriately concise (2-4 paragraphs max unless detailed info is needed).
- Use **bold** for important terms or action items.
- When listing steps or medications, use numbered or bulleted lists.
- Always end serious health conversations with a reminder to consult a healthcare professional.
- Be culturally sensitive and aware that healthcare access may be limited.${contextSection}

## Critical Safety Rule:
If the user describes any life-threatening emergency (chest pain, stroke symptoms, severe bleeding, difficulty breathing, loss of consciousness), immediately and clearly tell them to call emergency services or go to the nearest hospital FIRST, before any other response.

## Actions / Tool Calling:
If the user tells you they just took a medication, you MUST log it by including this exact JSON block anywhere in your reply:
\`\`\`json
{"action": "LOG_MEDICATION", "medication_name": "NameOfMedication"}
\`\`\`
If the user says they need to consult a doctor for a non-emergency, include this:
\`\`\`json
{"action": "CREATE_CONSULTATION"}
\`\`\``
}

/* ─── Rate Limiter (in-memory, per user) ─────────────────────────────────── */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20   // requests
const RATE_WINDOW = 60_000  // per minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false

  entry.count++
  return true
}

/* ─── Groq Streaming ─────────────────────────────────────────────────────── */

async function streamFromGroq(
  messages: IncomingMessage[],
  systemPrompt: string,
  controller: ReadableStreamDefaultController
) {
  const encoder = new TextEncoder()

  const send = (token: string) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
  }

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
      max_tokens: 800,
      temperature: 0.65,
    }),
  })

  if (!groqRes.ok) {
    throw new Error(`Groq API error: ${groqRes.status} ${groqRes.statusText}`)
  }

  const reader = groqRes.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split("\n").filter(l => l.startsWith("data: "))

    for (const line of lines) {
      const data = line.slice(6).trim()
      if (data === "[DONE]") continue

      try {
        const parsed = JSON.parse(data)
        const token = parsed.choices?.[0]?.delta?.content
        if (token) send(token)
      } catch {
        // skip malformed chunks
      }
    }
  }
}

/* ─── Mistral Fallback ───────────────────────────────────────────────────── */

async function streamFromMistral(
  messages: IncomingMessage[],
  systemPrompt: string,
  controller: ReadableStreamDefaultController
) {
  const encoder = new TextEncoder()

  const send = (token: string) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
  }

  const mistralRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
      max_tokens: 800,
      temperature: 0.65,
    }),
  })

  if (!mistralRes.ok) {
    throw new Error(`Mistral API error: ${mistralRes.status} ${mistralRes.statusText}`)
  }

  const reader = mistralRes.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split("\n").filter(l => l.startsWith("data: "))

    for (const line of lines) {
      const data = line.slice(6).trim()
      if (data === "[DONE]") continue

      try {
        const parsed = JSON.parse(data)
        const token = parsed.choices?.[0]?.delta?.content
        if (token) send(token)
      } catch {
        // skip
      }
    }
  }
}

/* ─── Route Handler ─────────────────────────────────────────────────────── */

export async function POST(req: Request) {
  try {
    // Auth check
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      )
    }

    // Parse body
    const body = await req.json()
    const messages: IncomingMessage[] = (body.messages ?? []).slice(-30) // last 30 messages
    const context: ChatContext = body.context ?? { role: "patient", currentPage: "Dashboard" }

    // Get user's name for personalisation
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single()

    const systemPrompt = buildSystemPrompt(
      { ...context, role: (profile?.role as UserRole) ?? context.role },
      profile?.full_name
    )

    // Streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          // Try Groq first
          await streamFromGroq(messages, systemPrompt, controller)
        } catch (groqErr) {
          console.warn("Groq failed, falling back to Mistral:", groqErr)

          try {
            await streamFromMistral(messages, systemPrompt, controller)
          } catch (mistralErr) {
            console.error("Mistral also failed:", mistralErr)
            const errMsg = "I'm having trouble connecting right now. Please try again in a moment."
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ token: errMsg })}\n\n`)
            )
          }
        }

        // Signal end
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (err: unknown) {
    console.error("AI Chat API error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
