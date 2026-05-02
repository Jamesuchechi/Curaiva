import { NextResponse } from "next/server";

/**
 * Curaiva AI — A2A COIN Intent Router
 * 
 * Simulates and programmatically handles COIN intent → response cycles
 * for hackathon demonstration.
 */
export async function POST(req: Request) {
  try {
    const { intent, patient_ids, patient_id, session_notes, chw_id } = await req.json();

    let toolName: string;
    let toolArgs: Record<string, unknown>;
    let emittedIntent: string;

    switch (intent) {
      case "chw_briefing":
        toolName = "generate_chw_priority_queue";
        toolArgs = { patient_ids: patient_ids || ["592903", "12724", "88234", "45611"], chw_id };
        emittedIntent = "chw_queue_ready";
        break;
      case "triage_request":
        toolName = "triage_patient";
        toolArgs = { patient_id, symptoms: session_notes || "Assessment requested by external agent" };
        emittedIntent = "triage_result";
        break;
      case "mental_health_check":
        toolName = "mental_health_assessment";
        toolArgs = { patient_id, session_notes };
        emittedIntent = "crisis_alert";
        break;
      case "consultation_prep":
        toolName = "create_consultation_brief";
        toolArgs = { patient_id };
        emittedIntent = "clinical_brief_ready";
        break;
      case "medication_review":
        toolName = "check_medication_adherence";
        toolArgs = { patient_id };
        emittedIntent = "adherence_result";
        break;
      default:
        return NextResponse.json({ error: `Unknown COIN intent: ${intent}` }, { status: 400 });
    }

    const { callMcpTool } = await import("@/lib/mcp-client");
    const result = await callMcpTool(toolName, toolArgs, "https://hapi.fhir.org/baseR4", patient_id);

    return NextResponse.json({
      coin_protocol_version: "1.0",
      from_agent: "curaiva-ai",
      intent_received: intent,
      intent_emitted: emittedIntent,
      timestamp: new Date().toISOString(),
      payload: result,
      sharp_compliant: true,
      fhir_resources_used: result.fhir_resources_used || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    description: "Curaiva AI — A2A COIN Intent Router",
    version: "1.0.0",
    accepts: [
      { intent: "chw_briefing", required: ["patient_ids"] },
      { intent: "triage_request", required: ["patient_id", "session_notes"] },
      { intent: "mental_health_check", required: ["patient_id", "session_notes"] },
      { intent: "consultation_prep", required: ["patient_id"] },
      { intent: "medication_review", required: ["patient_id"] },
    ],
    emits: ["chw_queue_ready", "triage_result", "crisis_alert", "clinical_brief_ready", "adherence_result"],
    sharp_compliant: true,
  });
}
