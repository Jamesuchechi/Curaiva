"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  User, 
  Save, 
  ChevronLeft, 
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { Profile } from "@/types"

export default function ProfileEditPage() {
  const { profile, loading: authLoading, refreshProfile } = useAuth()

  if (authLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-lime" /></div>
  if (!profile) return null

  return <ProfileEditForm profile={profile} refreshProfile={refreshProfile} />
}

function ProfileEditForm({ profile, refreshProfile }: { profile: Profile, refreshProfile: () => Promise<void> }) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  const [formData, setFormData] = React.useState({
    full_name: profile.full_name || "",
    specialty: profile.specialty || "",
    bio: profile.bio || "",
    years_experience: profile.years_experience || 0,
    is_available: profile.is_available ?? true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          specialty: formData.specialty,
          bio: formData.bio,
          years_experience: Number(formData.years_experience),
          is_available: formData.is_available
        })
        .eq('id', profile.id)

      if (updateError) throw updateError
      
      setSuccess(true)
      await refreshProfile()
      setTimeout(() => router.push("/dashboard/profile"), 1500)
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update profile"
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/profile">
          <Button variant="ghost" className="gap-2 text-text-muted hover:text-text-light">
            <ChevronLeft className="w-4 h-4" /> Back to Profile
          </Button>
        </Link>
        <h1 className="text-2xl font-display font-bold text-text-white">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="glass overflow-hidden">
          <CardHeader className="p-8 border-b border-border-base bg-surface-2/30">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-surface border-4 border-border-base flex items-center justify-center text-3xl font-bold text-text-muted overflow-hidden">
                  {profile.full_name?.charAt(0) || <User />}
                </div>
                <button type="button" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>
              <p className="text-xs text-text-muted font-mono uppercase tracking-widest">Profile Picture</p>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input 
                id="full_name" 
                value={formData.full_name}
                onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="James Uchechi"
                className="bg-surface-2 border-border-base focus:border-brand-lime h-12"
                required
              />
            </div>

            {(profile.role === 'doctor' || profile.role === 'chw') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Professional Title / Specialty</Label>
                  <Input 
                    id="specialty" 
                    value={formData.specialty}
                    onChange={e => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                    placeholder="General Practitioner / Community Health Worker"
                    className="bg-surface-2 border-border-base focus:border-brand-lime h-12"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input 
                      id="experience" 
                      type="number"
                      value={formData.years_experience}
                      onChange={e => setFormData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                      className="bg-surface-2 border-border-base focus:border-brand-lime h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Consultation Status</Label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, is_available: !prev.is_available }))}
                      className={cn(
                        "w-full h-12 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-sm",
                        formData.is_available 
                          ? "bg-teal/10 border-teal/20 text-teal" 
                          : "bg-red/10 border-red/20 text-red"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full", formData.is_available ? "bg-teal animate-pulse" : "bg-red")} />
                      {formData.is_available ? "Available" : "Busy/Offline"}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <textarea 
                    id="bio" 
                    value={formData.bio}
                    onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    placeholder="Tell us about your professional background..."
                    className="w-full rounded-xl bg-surface-2 border border-border-base p-4 focus:border-brand-lime outline-none text-sm transition-all"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red/10 border border-red/20 text-red flex items-center gap-3 animate-in fade-in zoom-in-95">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-teal/10 border border-teal/20 text-teal flex items-center gap-3 animate-in fade-in zoom-in-95">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p className="text-sm">Profile updated successfully! Redirecting...</p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-brand-lime text-bg font-bold text-lg rounded-2xl hover:opacity-90 shadow-xl shadow-brand-lime/10 disabled:opacity-50 gap-3"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
