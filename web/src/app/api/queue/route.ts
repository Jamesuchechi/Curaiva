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

    const { patient_ids } = await req.json();
    const { callMcpTool } = await import("@/lib/mcp-client");

    let targetIds: string[] = patient_ids;

    // If no IDs provided, discover some from FHIR first
    if (!targetIds || targetIds.length === 0) {
      const discoveryResult = await callMcpTool(
        "list_fhir_patients",
        { count: 10 },
        "https://hapi.fhir.org/baseR4"
      );
      if (discoveryResult.patients) {
        targetIds = discoveryResult.patients.map((p: { id: string }) => p.id);
      }
    }

    // Fallback if discovery failed or empty
    if (!targetIds || targetIds.length === 0) {
      targetIds = ["592903", "12724", "88234", "45611"];
    }

    const toolResult = await callMcpTool(
      "generate_chw_priority_queue",
      { 
        patient_ids: targetIds,
        chw_id: user.id
      },
      "https://hapi.fhir.org/baseR4"
    );

    return NextResponse.json(toolResult);
  } catch (error: unknown) {
    console.error("Queue API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
