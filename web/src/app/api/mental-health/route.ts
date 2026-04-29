import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: "", ...options }); },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { patient_id, session_notes, mood_score } = await req.json();

    const { callMcpTool } = await import("@/lib/mcp-client");
    const toolResult = await callMcpTool(
      "mental_health_assessment",
      {
        patient_id,
        session_notes: session_notes || `Patient reported mood score: ${mood_score}/10`,
        check_fhir_history: true
      },
      "https://hapi.fhir.org/baseR4",
      patient_id
    );

    return NextResponse.json(toolResult);
  } catch (error: unknown) {
    console.error("Mental Health API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
