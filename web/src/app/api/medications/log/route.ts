import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { medication_id, log_id } = await req.json();
    const now = new Date().toISOString();

    interface LogPayload {
      patient_id: string;
      medication_id: string;
      status: string;
      scheduled_at?: string;
      id?: string;
    }

    const payload: LogPayload = {
      patient_id: user.id,
      medication_id,
      status: "taken",
      scheduled_at: now
    };

    // Only include ID if it's a valid truthy value
    if (log_id && log_id !== "undefined") {
      payload.id = log_id;
    }

    // Attempt the upsert
    const { data, error } = await supabase
      .from("medication_logs")
      .upsert(payload)
      .select();

    if (error) {
      console.error("Supabase Error Details:", error);
      // If scheduled_at failed, try one more time without it
      if (error.message?.includes("column \"scheduled_at\" does not exist")) {
        const rest = { ...payload };
        delete rest.scheduled_at;
        const { error: retryError } = await supabase.from("medication_logs").upsert(rest);
        if (retryError) throw retryError;
      } else {
        throw error;
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("Medication Log API Error:", error);
    const err = error as { message?: string; details?: string; hint?: string };
    return NextResponse.json({ 
      error: err.message || "Unknown error",
      details: err.details || null,
      hint: err.hint || null
    }, { status: 500 });
  }
}
