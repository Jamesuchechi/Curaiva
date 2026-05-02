# Curaiva AI — Compliance & Feasibility Pathway

> **Documenting the path to production for regulated healthcare environments.**

Curaiva AI is designed with a "Security-First, Data-Light" architecture to simplify compliance. However, moving from a hackathon demonstration to a clinical production environment requires specific legal and technical steps.

---

## 1. Regulatory Frameworks

### HIPAA (United States)
To process Protected Health Information (PHI) under HIPAA, deploying organisations must:
- **Execute Business Associate Agreements (BAAs):** BAAs must be signed with all sub-processors, including:
  - **Supabase** (Requires Team or Enterprise plan)
  - **Groq** (Verify BAA availability for healthcare customers)
  - **Mistral AI** (Verify BAA availability)
  - **Vercel** (For frontend/API hosting)
- **Encryption:** All data must be encrypted at rest and in transit (already implemented in Curaiva).
- **Audit Logging:** Enable detailed logging of all PHI access.

### NDPA (Nigeria)
Compliance with the Nigeria Data Protection Act 2023 requires:
- **Data Minimisation:** Curaiva already follows this by not storing raw FHIR data.
- **Local Storage Considerations:** If required by future regulations, Supabase regions should be selected to align with residency requirements.
- **DPIA:** Conduct a Data Protection Impact Assessment before large-scale clinical rollout.

---

## 2. FHIR Integration Scopes

To ensure the principle of **Least Privilege**, Curaiva AI should only be granted the minimum necessary FHIR scopes.

**Minimum Required Scopes:**
| Resource | Required Scopes | Purpose |
| :--- | :--- | :--- |
| `Patient` | `patient/*.read` | Basic demographics for summary and identification |
| `Condition` | `patient/*.read` | Diagnosis history for triage and clinical briefs |
| `Observation` | `patient/*.read` | Vital signs and survey responses (mental health) |
| `MedicationRequest` | `patient/*.read` | Current prescriptions for adherence tracking |
| `Encounter` | `patient/*.read` | Visit history for clinical context |

*Note: Curaiva currently does not require `write` scopes as it acts as an intelligence layer rather than an EHR data-entry tool.*

---

## 3. Feasibility Analysis: A2A Healthcare

The Agent-to-Agent (A2A) model via Prompt Opinion and the COIN protocol presents a feasible path for interoperable healthcare:

- **Discoverability:** Healthcare providers can list "Clinical Superpowers" (MCP servers) that other agents can discover via the Marketplace.
- **Standardisation:** Using COIN (Clinical Orchestration & Information Network) intents ensures that a "triage request" from one vendor's agent is understood by Curaiva's agent.
- **Consent:** The A2A handshake must include a user-consent token, ensuring that Patient A's data is only shared between Agent X and Agent Y with explicit permission.

---

## 4. Implementation Roadmap

1. **Phase 1 (Hackathon):** Public FHIR servers, sandbox API keys, standard SHARP context.
2. **Phase 2 (Pilot):** Private FHIR sandbox (Aidbox/Azure), BAA execution, restricted IP access for MCP server.
3. **Phase 3 (Production):** Full EHR integration (Epic/Cerner via App Orchard/Code), SOC 2 Type II audit, clinical validation study.

---

_Curaiva AI — Bridging healthcare gaps with compliant, interoperable intelligence._
