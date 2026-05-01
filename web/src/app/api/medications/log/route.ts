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

    interface MedicationLogPayload {
      id?: string;
      patient_id: string;
      medication_id: string;
      scheduled_at: string;
      status: string;
    }

    const payload: MedicationLogPayload = {
      patient_id: user.id,
      medication_id,
      scheduled_at: now,
      status: "taken",
    };

    if (log_id) payload.id = log_id;

    // Upsert a medication log record marking this dose as taken
    const { error } = await supabase.from("medication_logs").upsert(payload);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Medication Log API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
