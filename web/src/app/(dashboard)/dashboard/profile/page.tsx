"use client"

import * as React from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { 
  Mail, 
  Shield, 
  Calendar, 
  MapPin, 
  Award, 
  Briefcase, 
  Edit3, 
  ExternalLink,
  CheckCircle2,
  Clock,
  Heart,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function ProfilePage() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-surface-2" />
          <div className="h-4 w-32 bg-surface-2 rounded" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  const initials = profile.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header / Hero */}
      <div className="relative overflow-hidden rounded-[32px] border border-border-base bg-surface shadow-2xl">
        <div className="absolute inset-0 bg-linear-to-br from-brand-lime/10 via-transparent to-purple/10" />
        
        <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-linear-to-tr from-brand-lime to-teal blur opacity-30 animate-pulse" />
            <Avatar fallback={initials} size="xl" className="relative w-32 h-32 border-4 border-surface shadow-xl" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h1 className="text-4xl font-display font-bold text-text-white">{profile.full_name}</h1>
              <Badge variant="stable" className="w-fit mx-auto md:mx-0 bg-brand-lime/10 text-brand-lime border-brand-lime/20 capitalize px-3 py-1">
                {profile.role}
              </Badge>
            </div>
            <p className="text-text-muted flex items-center justify-center md:justify-start gap-2">
              <Mail className="w-4 h-4" /> {profile.id.slice(0, 8)}... (FHIR Account)
            </p>
          </div>

          <Link href="/dashboard/profile/edit">
            <Button className="bg-brand-lime text-bg hover:opacity-90 gap-2 px-6 h-12 font-bold shadow-lg shadow-brand-lime/10">
              <Edit3 className="w-4 h-4" /> Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="glass p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Account Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-4 h-4 text-brand-lime" />
                  <div>
                    <p className="text-text-muted text-[10px] uppercase font-mono">Status</p>
                    <p className="text-text-white font-bold">Verified</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-brand-lime" />
                  <div>
                    <p className="text-text-muted text-[10px] uppercase font-mono">Member Since</p>
                    <p className="text-text-white font-bold">
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'New Member'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-brand-lime" />
                  <div>
                    <p className="text-text-muted text-[10px] uppercase font-mono">Location</p>
                    <p className="text-text-white font-bold">Lagos, Nigeria</p>
                  </div>
                </div>
              </div>
            </div>

            {profile.role === 'patient' && (
              <div className="pt-6 border-t border-border-base">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">FHIR Integration</h3>
                <div className="p-4 rounded-2xl bg-surface-2 border border-border-base space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Patient ID</span>
                    <span className="font-mono text-brand-lime">{profile.fhir_patient_id || "Not Linked"}</span>
                  </div>
                  <Button variant="ghost" className="w-full h-8 text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-brand-lime p-0 gap-1">
                    View Record <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {profile.role === 'doctor' || profile.role === 'chw' ? (
            <>
              <Card className="glass p-8">
                <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-brand-lime" /> Professional Biography
                </h2>
                <p className="text-text-light leading-relaxed">
                  {profile.bio || "No biography provided yet. Edit your profile to tell us more about your background and expertise."}
                </p>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card className="glass p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-teal/10 text-teal">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold">Expertise</h3>
                  </div>
                  <p className="text-sm text-text-muted mb-3 font-mono uppercase tracking-tight">Specialization</p>
                  <p className="text-lg font-display font-bold text-text-white">
                    {profile.specialty || "General Practice"}
                  </p>
                  <div className="mt-4 pt-4 border-t border-border-base flex items-center justify-between">
                    <span className="text-xs text-text-muted">Experience</span>
                    <span className="text-sm font-bold text-teal">{profile.years_experience || 0} Years</span>
                  </div>
                </Card>

                <Card className="glass p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-amber/10 text-amber">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold">Availability</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn("w-2 h-2 rounded-full", profile.is_available ? "bg-teal animate-pulse" : "bg-red")} />
                    <span className="text-sm font-bold">{profile.is_available ? "Accepting Consultations" : "Currently Offline"}</span>
                  </div>
                  <div className="pt-4 border-t border-border-base flex items-center justify-between">
                    <span className="text-xs text-text-muted">Avg. Rating</span>
                    <div className="flex items-center gap-1 text-sm font-bold text-amber">
                      ★ {profile.rating || 5.0}
                    </div>
                  </div>
                </Card>
              </div>
            </>
          ) : (
            <>
              <Card className="glass p-8">
                <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-brand-lime" /> Health Overview
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Active Monitoring</h3>
                    <ul className="space-y-3">
                      {['Hypertension Control', 'Medication Adherence', 'Mood Tracking'].map(item => (
                        <li key={item} className="flex items-center gap-2 text-sm text-text-light">
                          <CheckCircle2 className="w-4 h-4 text-brand-lime" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Connected Devices</h3>
                    <div className="p-4 rounded-2xl bg-surface-2 border border-border-base flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-teal">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Curaiva AI Watch</p>
                        <p className="text-[10px] text-teal">Syncing Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="glass p-8">
                <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-lime" /> Recent Activity
                </h2>
                <div className="space-y-4">
                  {[
                    { action: "Medication Logged", time: "2 hours ago", detail: "Lisinopril 10mg taken" },
                    { action: "Consultation Resolved", time: "Yesterday", detail: "Dr. Eden Uba reviewed triage" },
                    { action: "Profile Updated", time: "3 days ago", detail: "Avatar changed" },
                  ].map((act, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-2 h-2 rounded-full bg-brand-lime mt-1.5" />
                      <div>
                        <p className="text-sm font-bold text-text-white">{act.action}</p>
                        <p className="text-xs text-text-muted">{act.time} · {act.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
