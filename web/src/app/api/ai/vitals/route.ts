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

    const { text } = await req.json()
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Call Groq API to parse the CHW's voice transcript into structured vitals
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
            content: `You are an AI Medical Scribe. 
Extract vitals from the provided text and return ONLY a valid JSON object. 
If a value is not mentioned, return null for that field.

Fields to extract:
1. "blood_pressure": string (e.g. "120/80")
2. "heart_rate": number (bpm)
3. "temperature": number (celsius or fahrenheit)
4. "weight": number (kg or lbs)
5. "blood_sugar": number (mg/dL)

Example output:
{
  "blood_pressure": "140/90",
  "heart_rate": 88,
  "temperature": 98.6,
  "weight": 70,
  "blood_sugar": 110
}`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error?.message || "Failed to parse vitals with Groq")
    }

    const aiData = await res.json()
    const parsedVitals = JSON.parse(aiData.choices[0].message.content)

    return NextResponse.json({ vitals: parsedVitals })

  } catch (error: unknown) {
    console.error("AI Vitals Parse Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
