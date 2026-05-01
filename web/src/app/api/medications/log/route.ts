import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function PATCH(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { medication_id, log_id } = await req.json();
    const now = new Date().toISOString();

    // Validation
    const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    
    if (!medication_id || !isUUID(medication_id)) {
      return NextResponse.json({ 
        error: "Invalid medication_id format", 
        received: medication_id,
        hint: "Expected a valid UUID string" 
      }, { status: 400 });
    }

    let result;
    
    // If we have a log_id, we update existing log. Otherwise we insert new.
    if (log_id && log_id !== "undefined" && log_id !== "null" && isUUID(log_id)) {
      console.log("Updating log:", log_id);
      const { data, error } = await supabase
        .from("medication_logs")
        .update({ status: "taken", scheduled_at: now })
        .eq("id", log_id);
      
      if (error) {
        console.error("Supabase Update Error:", error);
        throw error;
      }
      result = data;
    } else {
      // Normal insert
      const insertPayload = {
        patient_id: user.id,
        medication_id: medication_id,
        status: "taken",
        scheduled_at: now
      };
      
      const { data, error } = await supabase
        .from("medication_logs")
        .insert(insertPayload);

      if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
      }
      result = data;
    }

    return NextResponse.json({ success: true, data: result });

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
