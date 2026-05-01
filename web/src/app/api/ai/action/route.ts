import { NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: "", ...options }) },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { command } = await req.json()
    if (!command) {
      return NextResponse.json({ error: "Command is required" }, { status: 400 })
    }

    // Call Groq API to parse the doctor's intent into structured JSON
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: `You are an AI Clinical Parser. 
Extract the intent from the doctor's command and return ONLY a valid JSON object. 
Do not include markdown blocks, explanations, or any other text. Just the JSON.

Rules for output:
1. "action_type": Must be one of ["prescribe", "log_alert", "schedule_followup", "unknown"]
2. If "prescribe", include "medication_name" (string), "dose" (string, e.g. "500mg"), "frequency" (string, e.g. "twice daily").
3. If "log_alert", include "alert_reason" (string).
4. If "schedule_followup", include "timeframe" (string).`
          },
          {
            role: "user",
            content: command
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error?.message || "Failed to parse command with Groq")
    }

    const aiData = await res.json()
    const parsedAction = JSON.parse(aiData.choices[0].message.content)

    return NextResponse.json({ action: parsedAction })

  } catch (error: unknown) {
    console.error("AI Action Parse Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
