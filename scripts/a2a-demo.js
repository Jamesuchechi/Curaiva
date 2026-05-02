/**
 * Curaiva AI — COIN Protocol Exchange Simulation
 * 
 * This script demonstrates the Agent-to-Agent (A2A) handshake and intent 
 * exchange between a 'Coordinator Agent' and the 'Curaiva AI Agent'.
 */

const SIMULATED_EXCHANGE = {
  timestamp: new Date().toISOString(),
  protocol: "COIN v1.0",
  flow: [
    {
      from: "HealthConnect Coordinator",
      to: "Curaiva AI",
      action: "INTENT_EMIT",
      intent: "triage_request",
      payload: {
        patient_id: "592903",
        symptoms: "Persistent abdominal pain, nausea, and low-grade fever for 24 hours.",
        fhir_base_url: "https://hapi.fhir.org/baseR4"
      },
      metadata: {
        priority: "high",
        correlation_id: "tx_99283"
      }
    },
    {
      from: "Curaiva AI",
      to: "HealthConnect Coordinator",
      action: "ACK",
      metadata: { correlation_id: "tx_99283" }
    },
    {
      from: "Curaiva AI",
      to: "HealthConnect Coordinator",
      action: "INTENT_EMIT",
      intent: "triage_result",
      payload: {
        patient_id: "592903",
        severity: "moderate",
        severity_score: 6,
        escalate_to_doctor: true,
        recommended_action: "Schedule urgent GP consultation within 24 hours.",
        likely_conditions: ["Appendicitis (early stage)", "Gastroenteritis"],
        disclaimer: "AI-generated assessment. Not a diagnosis."
      },
      metadata: {
        correlation_id: "tx_99283",
        tools_used: ["triage_patient"]
      }
    }
  ]
};

console.log("=== COIN Protocol Exchange Simulation ===");
console.log(JSON.stringify(SIMULATED_EXCHANGE, null, 2));
console.log("\n[SUCCESS] A2A handshake complete. Intent cycle resolved.");
