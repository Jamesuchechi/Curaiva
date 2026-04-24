/**
 * Curaiva AI — MCP Server
 * "The Healthcare Superpower"
 *
 * Exposes 6 FHIR-powered healthcare tools via the Model Context Protocol.
 * Compliant with SHARP Extension Specs for Prompt Opinion platform integration.
 *
 * Deploy: Railway / Render / Fly.io
 * Protocol: MCP over HTTP (SSE transport)
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import Groq from "groq-sdk";
import { Mistral } from "@mistralai/mistralai";
import express from "express";
import "dotenv/config";
// ─── FHIR Client ─────────────────────────────────────────────────────────────
class FhirClient {
    baseUrl;
    token;
    constructor(context) {
        this.baseUrl = context.fhir_base_url.replace(/\/$/, "");
        this.token = context.fhir_access_token;
    }
    async fetch(path) {
        const headers = {
            "Accept": "application/fhir+json",
            "Content-Type": "application/fhir+json",
        };
        if (this.token) {
            headers["Authorization"] = `Bearer ${this.token}`;
        }
        const res = await globalThis.fetch(`${this.baseUrl}/${path}`, { headers });
        if (!res.ok) {
            throw new Error(`FHIR request failed: ${res.status} ${res.statusText} — ${path}`);
        }
        return res.json();
    }
    async getPatient(patientId) {
        return this.fetch(`Patient/${patientId}`);
    }
    async getObservations(patientId, category) {
        const query = category
            ? `Observation?patient=${patientId}&category=${category}&_sort=-date&_count=20`
            : `Observation?patient=${patientId}&_sort=-date&_count=20`;
        const bundle = await this.fetch(query);
        return bundle.entry?.map(e => e.resource) ?? [];
    }
    async getMedications(patientId) {
        const bundle = await this.fetch(`MedicationRequest?patient=${patientId}&status=active&_count=50`);
        return bundle.entry?.map(e => e.resource) ?? [];
    }
    async getConditions(patientId) {
        const bundle = await this.fetch(`Condition?patient=${patientId}&clinical-status=active&_count=30`);
        return bundle.entry?.map(e => e.resource) ?? [];
    }
    async getEncounters(patientId) {
        const bundle = await this.fetch(`Encounter?patient=${patientId}&_sort=-date&_count=10`);
        return bundle.entry?.map(e => e.resource) ?? [];
    }
}
// ─── AI Clients ──────────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
/**
 * callAI — Primary clinical reasoning engine.
 * Uses Mistral Large for high-accuracy medical triage and assessment.
 */
async function callAI(system, user, maxTokens = 1024) {
    const response = await mistral.chat.complete({
        model: "mistral-large-latest",
        messages: [
            { role: "system", content: system },
            { role: "user", content: user },
        ],
        maxTokens,
        temperature: 0.1,
        responseFormat: { type: "json_object" },
    });
    return response.choices?.[0]?.message?.content || "";
}
/**
 * callAIText — High-speed clinical writing engine.
 * Uses Llama 3.3 via Groq for near-instant brief generation.
 */
async function callAIText(system, user, maxTokens = 2000) {
    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: system },
            { role: "user", content: user },
        ],
        max_tokens: maxTokens,
        temperature: 0.5,
    });
    return response.choices[0]?.message?.content || "";
}
// ─── Helper Utilities ─────────────────────────────────────────────────────────
function extractSharpContext(extra) {
    const sharp = (extra?.sharp_context ?? extra ?? {});
    return {
        fhir_base_url: sharp.fhir_base_url || process.env.DEFAULT_FHIR_BASE_URL || "https://hapi.fhir.org/baseR4",
        fhir_access_token: sharp.fhir_access_token,
        patient_id: sharp.patient_id,
        encounter_id: sharp.encounter_id,
        practitioner_id: sharp.practitioner_id,
        tenant_id: sharp.tenant_id,
    };
}
function patientDisplayName(patient) {
    const name = patient.name?.[0];
    if (!name)
        return `Patient ${patient.id}`;
    const given = name.given?.join(" ") ?? "";
    const family = name.family ?? "";
    return `${given} ${family}`.trim() || `Patient ${patient.id}`;
}
function calculateAge(birthDate) {
    if (!birthDate)
        return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate()))
        age--;
    return age;
}
// ─── MCP Server ───────────────────────────────────────────────────────────────
const server = new McpServer({
    name: "curaiva-ai",
    version: "1.0.0",
    description: "Curaiva AI Healthcare Superpower — AI-powered clinical intelligence tools for triage, " +
        "patient summarization, medication adherence, mental health assessment, CHW prioritization, " +
        "and consultation briefing. FHIR R4 native. SHARP context compliant.",
});
// ══════════════════════════════════════════════════════════════════════════════
// TOOL 1: triage_patient
// ══════════════════════════════════════════════════════════════════════════════
server.tool("triage_patient", "Assess patient symptoms using AI triage. Fetches patient history from FHIR, scores severity " +
    "(low/moderate/critical), identifies likely conditions, and determines if doctor escalation is needed. " +
    "Returns structured JSON triage assessment with FHIR patient context.", {
    symptoms: z.string().describe("Patient-reported symptoms in plain language (text or transcribed voice)"),
    patient_id: z.string().optional().describe("FHIR Patient resource ID. Falls back to SHARP context patient_id."),
    include_history: z.boolean().optional().default(true).describe("Whether to fetch FHIR conditions and observations to inform triage"),
}, async ({ symptoms, patient_id, include_history }, extra) => {
    const ctx = extractSharpContext(extra);
    const pid = patient_id || ctx.patient_id;
    const fhir = new FhirClient(ctx);
    let patientContext = "No patient record linked.";
    let patientName = "Unknown patient";
    if (pid) {
        try {
            const [patient, conditions, observations] = await Promise.all([
                fhir.getPatient(pid),
                include_history ? fhir.getConditions(pid) : Promise.resolve([]),
                include_history ? fhir.getObservations(pid, "vital-signs") : Promise.resolve([]),
            ]);
            patientName = patientDisplayName(patient);
            const age = calculateAge(patient.birthDate);
            const conditionList = conditions.map(c => c.code?.text || c.code?.coding?.[0]?.display || "Unknown").join(", ") || "None recorded";
            const vitalList = observations.slice(0, 5).map(o => {
                const val = o.valueQuantity ? `${o.valueQuantity.value} ${o.valueQuantity.unit}` : o.valueString || "N/A";
                return `${o.code?.text || o.code?.coding?.[0]?.display}: ${val}`;
            }).join("; ") || "None recorded";
            patientContext = `
Patient: ${patientName} | Age: ${age ?? "Unknown"} | Gender: ${patient.gender ?? "Unknown"}
Active conditions: ${conditionList}
Recent vitals: ${vitalList}
FHIR Patient ID: ${pid}
        `.trim();
        }
        catch (err) {
            patientContext = `Patient ${pid} — FHIR fetch failed: ${err.message}`;
        }
    }
    const assessment = await callAI(`You are a clinical triage AI assistant integrated into a healthcare platform. 
Your role is to assess patient symptoms and provide a structured triage decision.

CRITICAL RULES:
- You are a triage TOOL, not a diagnosing physician. Always recommend professional evaluation.
- Severity "critical" MUST trigger escalate_to_doctor: true.
- Always include a medical disclaimer.
- Respond ONLY in valid JSON — no preamble, no markdown fences.

JSON schema:
{
  "severity": "low" | "moderate" | "critical",
  "severity_score": 1-10,
  "primary_concern": "string — one-sentence summary",
  "likely_conditions": ["string"],
  "recommended_action": "string",
  "self_care_steps": ["string"],
  "red_flags": ["string — symptoms warranting emergency care"],
  "escalate_to_doctor": boolean,
  "fhir_context_used": boolean,
  "disclaimer": "string"
}`, `Patient Context (from FHIR):\n${patientContext}\n\nReported Symptoms:\n${symptoms}`);
    let parsed;
    try {
        parsed = JSON.parse(assessment);
    }
    catch {
        parsed = { error: "Failed to parse AI response", raw: assessment };
    }
    return {
        content: [{
                type: "text",
                text: JSON.stringify({
                    tool: "triage_patient",
                    patient_id: pid,
                    patient_name: patientName,
                    fhir_base_url: ctx.fhir_base_url,
                    symptoms_received: symptoms,
                    assessment: parsed,
                    timestamp: new Date().toISOString(),
                }, null, 2),
            }],
    };
});
// ══════════════════════════════════════════════════════════════════════════════
// TOOL 2: get_patient_summary
// ══════════════════════════════════════════════════════════════════════════════
server.tool("get_patient_summary", "Generate a comprehensive AI clinical summary for a patient by fetching their complete FHIR record " +
    "(demographics, conditions, medications, recent observations, encounters). Returns a structured brief " +
    "ready for a clinician to read before a consultation.", {
    patient_id: z.string().optional().describe("FHIR Patient resource ID. Falls back to SHARP context patient_id."),
    summary_type: z.enum(["brief", "full", "consultation"]).optional().default("consultation")
        .describe("brief=2-3 sentences; full=comprehensive; consultation=optimised for pre-consult reading"),
}, async ({ patient_id, summary_type }, extra) => {
    const ctx = extractSharpContext(extra);
    const pid = patient_id || ctx.patient_id;
    if (!pid) {
        return {
            content: [{ type: "text", text: JSON.stringify({ error: "No patient_id provided. Pass patient_id or include in SHARP context." }) }],
            isError: true,
        };
    }
    const fhir = new FhirClient(ctx);
    const [patient, conditions, medications, observations, encounters] = await Promise.all([
        fhir.getPatient(pid),
        fhir.getConditions(pid),
        fhir.getMedications(pid),
        fhir.getObservations(pid),
        fhir.getEncounters(pid),
    ]);
    const age = calculateAge(patient.birthDate);
    const name = patientDisplayName(patient);
    const rawData = {
        patient: { name, age, gender: patient.gender, location: patient.address?.[0]?.city },
        conditions: conditions.map(c => ({
            name: c.code?.text || c.code?.coding?.[0]?.display,
            status: c.clinicalStatus?.coding?.[0]?.code,
            onset: c.onsetDateTime,
        })),
        medications: medications.map(m => ({
            name: m.medicationCodeableConcept?.text,
            dosage: m.dosageInstruction?.[0]?.text,
            status: m.status,
        })),
        recent_observations: observations.slice(0, 10).map(o => ({
            type: o.code?.text || o.code?.coding?.[0]?.display,
            value: o.valueQuantity ? `${o.valueQuantity.value} ${o.valueQuantity.unit}` : o.valueString,
            date: o.effectiveDateTime,
        })),
        encounter_count: encounters.length,
    };
    const prompts = {
        brief: "Write a 2-3 sentence patient summary a busy clinician can read in 10 seconds.",
        full: "Write a comprehensive clinical summary covering all available data points with clinical interpretation.",
        consultation: "Write a structured pre-consultation brief. Format: Chief Data Points, Active Problems, Current Medications, Recent Observations, Clinical Considerations. Be clinical, factual, and concise. This will be read by a physician immediately before seeing the patient.",
    };
    const summary = await callAIText(`You are a clinical documentation AI. Generate a ${summary_type} patient summary from FHIR data. ` +
        `Be accurate, clinical, and concise. Never fabricate data not present in the FHIR record.`, `FHIR Patient Data:\n${JSON.stringify(rawData, null, 2)}\n\nGenerate a ${summary_type} summary.\n\n${prompts[summary_type ?? "consultation"]}`, 1500);
    return {
        content: [{
                type: "text",
                text: JSON.stringify({
                    tool: "get_patient_summary",
                    patient_id: pid,
                    patient_name: name,
                    summary_type,
                    fhir_resources_used: ["Patient", "Condition", "MedicationRequest", "Observation", "Encounter"],
                    summary,
                    raw_fhir_snapshot: rawData,
                    timestamp: new Date().toISOString(),
                }, null, 2),
            }],
    };
});
// ══════════════════════════════════════════════════════════════════════════════
// TOOL 3: check_medication_adherence
// ══════════════════════════════════════════════════════════════════════════════
server.tool("check_medication_adherence", "Analyse a patient's active medication regimen from FHIR MedicationRequest resources and assess " +
    "adherence risk. Identifies high-risk medications, complex schedules, and generates CHW alert " +
    "recommendations for patients at risk of non-adherence.", {
    patient_id: z.string().optional().describe("FHIR Patient resource ID"),
    flag_threshold: z.number().optional().default(3)
        .describe("Number of active medications above which to flag as high-complexity"),
}, async ({ patient_id, flag_threshold }, extra) => {
    const ctx = extractSharpContext(extra);
    const pid = patient_id || ctx.patient_id;
    if (!pid) {
        return {
            content: [{ type: "text", text: JSON.stringify({ error: "patient_id required" }) }],
            isError: true,
        };
    }
    const fhir = new FhirClient(ctx);
    const [patient, medications] = await Promise.all([
        fhir.getPatient(pid),
        fhir.getMedications(pid),
    ]);
    const name = patientDisplayName(patient);
    const activeMeds = medications.filter(m => m.status === "active");
    const analysis = await callAI(`You are a clinical pharmacist AI analysing medication adherence risk. 
Respond ONLY in valid JSON with this schema:
{
  "adherence_risk": "low" | "moderate" | "high",
  "risk_score": 0-100,
  "medication_count": number,
  "complexity_factors": ["string"],
  "high_risk_medications": ["string — name and why it's high risk"],
  "adherence_barriers": ["string"],
  "chw_alert_recommended": boolean,
  "chw_alert_reason": "string",
  "recommendations": ["string — actionable steps to improve adherence"],
  "monitoring_priority": "routine" | "weekly" | "daily"
}`, `Patient: ${name} (ID: ${pid})
Active Medications (${activeMeds.length}):
${activeMeds.map((m, i) => `${i + 1}. ${m.medicationCodeableConcept?.text || "Unknown"} — ${m.dosageInstruction?.[0]?.text || "No dosage info"}`).join("\n")}

High-complexity threshold: ${flag_threshold} medications
Analyse adherence risk for this patient.`);
    let parsed;
    try {
        parsed = JSON.parse(analysis);
    }
    catch {
        parsed = { error: "Parse failed", raw: analysis };
    }
    return {
        content: [{
                type: "text",
                text: JSON.stringify({
                    tool: "check_medication_adherence",
                    patient_id: pid,
                    patient_name: name,
                    active_medication_count: activeMeds.length,
                    medications: activeMeds.map(m => ({
                        name: m.medicationCodeableConcept?.text,
                        dosage: m.dosageInstruction?.[0]?.text,
                        authored: m.authoredOn,
                    })),
                    analysis: parsed,
                    timestamp: new Date().toISOString(),
                }, null, 2),
            }],
    };
});
// ══════════════════════════════════════════════════════════════════════════════
// TOOL 4: mental_health_assessment
// ══════════════════════════════════════════════════════════════════════════════
server.tool("mental_health_assessment", "Perform an AI-powered mental health assessment based on patient-reported notes and FHIR observation " +
    "history. Detects mood patterns, crisis indicators, and generates CBT-informed recommendations. " +
    "Returns crisis_flag=true and escalation instructions if crisis language is detected.", {
    patient_id: z.string().optional().describe("FHIR Patient resource ID"),
    session_notes: z.string().describe("Patient's self-reported mental health notes, mood description, or session transcript"),
    check_fhir_history: z.boolean().optional().default(true)
        .describe("Whether to fetch FHIR mental health observations to provide longitudinal context"),
}, async ({ patient_id, session_notes, check_fhir_history }, extra) => {
    const ctx = extractSharpContext(extra);
    const pid = patient_id || ctx.patient_id;
    const fhir = new FhirClient(ctx);
    let fhirContext = "No FHIR history available.";
    let patientName = "Unknown";
    if (pid) {
        try {
            const [patient, observations] = await Promise.all([
                fhir.getPatient(pid),
                check_fhir_history ? fhir.getObservations(pid, "survey") : Promise.resolve([]),
            ]);
            patientName = patientDisplayName(patient);
            if (observations.length > 0) {
                fhirContext = `Recent mental health observations:\n${observations.slice(0, 8).map(o => `- ${o.code?.text || "Observation"}: ${o.valueString || o.valueQuantity?.value} (${o.effectiveDateTime?.split("T")[0]})`).join("\n")}`;
            }
        }
        catch {
            fhirContext = "FHIR history unavailable.";
        }
    }
    const assessment = await callAI(`You are a mental health support AI assistant integrated into a clinical platform.
      
CRITICAL SAFETY RULES:
- If ANY crisis indicators are present (suicidal ideation, self-harm intent, harm to others), set crisis_flag: true IMMEDIATELY.
- You are a support tool, NOT a therapist. Always recommend professional support.
- Respond ONLY in valid JSON.

JSON Schema:
{
  "mood_score": 1-10,
  "mood_category": "stable" | "low" | "moderate_distress" | "severe_distress" | "crisis",
  "crisis_flag": boolean,
  "crisis_indicators": ["string — exact phrases that triggered crisis detection"],
  "key_themes": ["string — emotional themes detected"],
  "cbt_recommendations": ["string — CBT-based coping strategies"],
  "suggested_exercise": "string | null — specific exercise to offer patient",
  "escalation_action": "none" | "schedule_followup" | "notify_chw" | "emergency_referral",
  "escalation_reason": "string | null",
  "clinical_notes": "string — brief clinical interpretation for the care team",
  "disclaimer": "string"
}`, `Patient: ${patientName} (ID: ${pid || "Not linked"})

FHIR Historical Context:
${fhirContext}

Patient Session Notes:
${session_notes}

Perform a mental health assessment.`);
    let parsed;
    try {
        parsed = JSON.parse(assessment);
    }
    catch {
        parsed = { error: "Parse failed", raw: assessment };
    }
    // If crisis detected, always include emergency resources in response
    const crisis = parsed.crisis_flag === true;
    return {
        content: [{
                type: "text",
                text: JSON.stringify({
                    tool: "mental_health_assessment",
                    patient_id: pid,
                    patient_name: patientName,
                    crisis_detected: crisis,
                    ...(crisis && {
                        emergency_resources: {
                            global: "International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/",
                            nigeria: "SURPIN Nigeria: 0800-SURPIN-1 (0800-787746-1)",
                            note: "If patient is in immediate danger, contact emergency services immediately.",
                        },
                    }),
                    assessment: parsed,
                    timestamp: new Date().toISOString(),
                }, null, 2),
            }],
    };
});
// ══════════════════════════════════════════════════════════════════════════════
// TOOL 5: generate_chw_priority_queue
// ══════════════════════════════════════════════════════════════════════════════
server.tool("generate_chw_priority_queue", "Generate an AI-prioritized patient watchlist for a Community Health Worker. Scores each patient " +
    "by urgency using FHIR data (conditions, medications, recent observations) and returns a ranked queue " +
    "with actionable visit recommendations. Designed for CHW morning briefings.", {
    patient_ids: z.array(z.string()).describe("Array of FHIR Patient IDs to assess and rank"),
    chw_id: z.string().optional().describe("FHIR Practitioner ID of the Community Health Worker"),
    max_results: z.number().optional().default(10).describe("Maximum number of patients to return in the ranked list"),
}, async ({ patient_ids, chw_id, max_results }, extra) => {
    const ctx = extractSharpContext(extra);
    const fhir = new FhirClient(ctx);
    // Fetch all patients in parallel
    const patientData = await Promise.allSettled(patient_ids.slice(0, 20).map(async (pid) => {
        const [patient, conditions, medications, observations] = await Promise.all([
            fhir.getPatient(pid),
            fhir.getConditions(pid),
            fhir.getMedications(pid),
            fhir.getObservations(pid),
        ]);
        return {
            id: pid,
            name: patientDisplayName(patient),
            age: calculateAge(patient.birthDate),
            conditions: conditions.length,
            active_meds: medications.filter(m => m.status === "active").length,
            recent_observations: observations.length,
            last_observation: observations[0]?.effectiveDateTime,
            condition_names: conditions.slice(0, 3).map(c => c.code?.text || "Unknown"),
        };
    }));
    const resolved = patientData
        .filter((r) => r.status === "fulfilled")
        .map(r => r.value);
    const priorityAnalysis = await callAI(`You are a clinical AI system generating a Community Health Worker priority queue.
Score each patient 0-100 for visit urgency. Higher = needs visit sooner.

Scoring factors:
- Number and severity of active conditions (weight: 30%)  
- Medication complexity and adherence risk (weight: 25%)
- Recency of clinical contact (weight: 20%)
- Age and vulnerability factors (weight: 15%)
- Observation gap (time since last recorded vital) (weight: 10%)

Respond ONLY in valid JSON:
{
  "queue": [
    {
      "patient_id": "string",
      "patient_name": "string",
      "priority_score": 0-100,
      "priority_tier": "critical" | "high" | "moderate" | "routine",
      "visit_recommendation": "Visit today" | "Visit this week" | "Check in" | "Routine monitoring",
      "primary_concern": "string — one sentence",
      "action_items": ["string"]
    }
  ],
  "summary": "string — brief CHW briefing note",
  "generated_for_chw": "string"
}`, `CHW ID: ${chw_id || ctx.practitioner_id || "Not specified"}
Patient data:\n${JSON.stringify(resolved, null, 2)}
Rank top ${max_results} patients by urgency.`);
    let parsed;
    try {
        parsed = JSON.parse(priorityAnalysis);
    }
    catch {
        parsed = { error: "Parse failed", raw: priorityAnalysis };
    }
    return {
        content: [{
                type: "text",
                text: JSON.stringify({
                    tool: "generate_chw_priority_queue",
                    chw_id: chw_id || ctx.practitioner_id,
                    patients_assessed: resolved.length,
                    patients_requested: patient_ids.length,
                    fhir_base_url: ctx.fhir_base_url,
                    priority_queue: parsed,
                    timestamp: new Date().toISOString(),
                }, null, 2),
            }],
    };
});
// ══════════════════════════════════════════════════════════════════════════════
// TOOL 6: create_consultation_brief
// ══════════════════════════════════════════════════════════════════════════════
server.tool("create_consultation_brief", "Generate a structured pre-consultation clinical brief for a doctor by combining FHIR patient data " +
    "with triage context. Produces a physician-ready document covering chief complaint, active problems, " +
    "medications, relevant history, and suggested focus areas for the consult.", {
    patient_id: z.string().optional().describe("FHIR Patient resource ID"),
    chief_complaint: z.string().optional().describe("The primary reason for today's consultation"),
    triage_severity: z.enum(["low", "moderate", "critical"]).optional()
        .describe("If this consult follows a triage, pass the severity level"),
    consultation_type: z.enum(["general", "urgent", "follow_up", "specialist"]).optional().default("general"),
}, async ({ patient_id, chief_complaint, triage_severity, consultation_type }, extra) => {
    const ctx = extractSharpContext(extra);
    const pid = patient_id || ctx.patient_id;
    if (!pid) {
        return {
            content: [{ type: "text", text: JSON.stringify({ error: "patient_id required" }) }],
            isError: true,
        };
    }
    const fhir = new FhirClient(ctx);
    const [patient, conditions, medications, observations] = await Promise.all([
        fhir.getPatient(pid),
        fhir.getConditions(pid),
        fhir.getMedications(pid),
        fhir.getObservations(pid),
    ]);
    const name = patientDisplayName(patient);
    const age = calculateAge(patient.birthDate);
    const brief = await callAIText(`You are a clinical documentation AI preparing a physician pre-consultation brief.
Write in a clear, clinical style. A busy doctor will read this in under 60 seconds.
Structure your response with these exact headers:

## PATIENT OVERVIEW
## CHIEF COMPLAINT  
## ACTIVE PROBLEMS
## CURRENT MEDICATIONS
## RECENT OBSERVATIONS
## CLINICAL CONSIDERATIONS
## SUGGESTED FOCUS AREAS

Be concise. Use clinical terminology. Highlight anything urgent.`, `Consultation Type: ${consultation_type}
${triage_severity ? `Triage Severity: ${triage_severity.toUpperCase()}` : ""}
${chief_complaint ? `Chief Complaint: ${chief_complaint}` : ""}

Patient: ${name} | Age: ${age} | Gender: ${patient.gender}

Active Conditions (${conditions.length}):
${conditions.map(c => `- ${c.code?.text || c.code?.coding?.[0]?.display || "Unknown"} (${c.clinicalStatus?.coding?.[0]?.code})`).join("\n") || "None"}

Active Medications (${medications.filter(m => m.status === "active").length}):
${medications.filter(m => m.status === "active").map(m => `- ${m.medicationCodeableConcept?.text}: ${m.dosageInstruction?.[0]?.text || "No dosage"}`).join("\n") || "None"}

Recent Observations:
${observations.slice(0, 8).map(o => `- ${o.code?.text || o.code?.coding?.[0]?.display}: ${o.valueQuantity ? `${o.valueQuantity.value} ${o.valueQuantity.unit}` : o.valueString || "N/A"} (${o.effectiveDateTime?.split("T")[0]})`).join("\n") || "None recorded"}`, 2000);
    return {
        content: [{
                type: "text",
                text: JSON.stringify({
                    tool: "create_consultation_brief",
                    patient_id: pid,
                    patient_name: name,
                    consultation_type,
                    triage_severity: triage_severity || null,
                    chief_complaint: chief_complaint || null,
                    encounter_id: ctx.encounter_id || null,
                    brief,
                    fhir_resources_used: ["Patient", "Condition", "MedicationRequest", "Observation"],
                    timestamp: new Date().toISOString(),
                }, null, 2),
            }],
    };
});
// ─── Express HTTP Server ──────────────────────────────────────────────────────
const app = express();
app.use(express.json());
// Health check
app.get("/health", (_req, res) => {
    res.json({
        status: "healthy",
        service: "curaiva-ai-mcp",
        version: "1.0.0",
        tools: [
            "triage_patient",
            "get_patient_summary",
            "check_medication_adherence",
            "mental_health_assessment",
            "generate_chw_priority_queue",
            "create_consultation_brief",
        ],
        fhir_default: process.env.DEFAULT_FHIR_BASE_URL || "https://hapi.fhir.org/baseR4",
        sharp_compliant: true,
        timestamp: new Date().toISOString(),
    });
});
// MCP Transport Setup
const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
});
await server.connect(transport);
// MCP endpoint — Prompt Opinion connects here
app.all("/mcp", async (req, res) => {
    console.log(`\n📬 MCP Request: ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`   Body: ${JSON.stringify(req.body).substring(0, 100)}...`);
    }
    await transport.handleRequest(req, res, req.body);
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n🏥 Curaiva AI MCP Server running on port ${PORT}`);
    console.log(`   Health:  http://localhost:${PORT}/health`);
    console.log(`   MCP:     http://localhost:${PORT}/mcp`);
    console.log(`   Tools:   6 FHIR-powered healthcare tools`);
    console.log(`   SHARP:   Compliant with Prompt Opinion extension specs\n`);
});
