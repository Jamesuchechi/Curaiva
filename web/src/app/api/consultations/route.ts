import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

async function makeServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

export async function POST(req: Request) {
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

    const { ai_summary, priority } = await req.json();

    // Create consultation for this patient
    const { data, error } = await supabase
      .from("consultations")
      .insert({
        patient_id: user.id,
        status: "open",
        ai_summary: ai_summary || "",
        priority: priority || "moderate",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ consultation: data });
  } catch (error: unknown) {
    console.error("Consultations API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

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

    let query = supabase
      .from("consultations")
      .select("*, profiles!patient_id(full_name, fhir_patient_id)")
      .order("created_at", { ascending: false });

    if (role === "patient") {
      query = query.eq("patient_id", user.id);
    } else if (role === "doctor") {
      query = query.eq("doctor_id", user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ consultations: data });
  } catch (error: unknown) {
    console.error("Consultations GET Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await makeServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { consultation_id, status } = await req.json();
    if (!consultation_id) {
      return NextResponse.json({ error: "consultation_id required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("consultations")
      .update({ status: status ?? "resolved" })
      .eq("id", consultation_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ consultation: data });
  } catch (error: unknown) {
    console.error("Consultations PATCH Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

