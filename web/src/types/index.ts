export type UserRole = 'patient' | 'doctor' | 'chw'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  fhir_patient_id: string | null
  fhir_base_url?: string
  avatar_url?: string
  created_at?: string
}

export interface TriageAssessment {
  severity: 'low' | 'moderate' | 'critical'
  severity_score: number
  primary_concern: string
  likely_conditions: string[]
  recommended_action: string
  self_care_steps: string[]
  red_flags: string[]
  escalate_to_doctor: boolean
  fhir_context_used: boolean
  disclaimer: string
}

export interface ConsultationBrief {
  patient: {
    name: string
    age: number
    gender: string
    id: string
  }
  severity: 'low' | 'moderate' | 'critical'
  complaint: string
  problems: string[]
  medications: string[]
  observations: {
    label: string
    value: string
    status: 'normal' | 'high' | 'low'
  }[]
  focus_areas: string[]
}

export interface QueueItem {
  id: string
  name: string
  score: number
  reason: string
  location: string
  status: 'critical' | 'urgent' | 'stable'
}
