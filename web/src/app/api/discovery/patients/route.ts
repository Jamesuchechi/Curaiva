import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
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

    const { callMcpTool } = await import("@/lib/mcp-client");
    const result = await callMcpTool(
      "list_fhir_patients",
      { count: 30 },
      "https://hapi.fhir.org/baseR4"
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Discovery API Error:", error);
    return NextResponse.json({ error: "Failed to fetch discovery data" }, { status: 500 });
  }
}
