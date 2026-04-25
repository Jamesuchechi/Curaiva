"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Spinner } from "@/components/ui/loading"
import { Heart, User, Stethoscope, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const roles = [
  { 
    id: 'patient', 
    title: 'Patient', 
    desc: 'Access triage and track health', 
    icon: User,
    color: 'teal'
  },
  { 
    id: 'doctor', 
    title: 'Doctor', 
    desc: 'Manage patient consultations', 
    icon: Stethoscope,
    color: 'coral'
  },
  { 
    id: 'chw', 
    title: 'CHW', 
    desc: 'Prioritise community care', 
    icon: Users,
    color: 'purple'
  }
]

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedRole, setSelectedRole] = React.useState('patient')

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string

    // 1. Sign up user
    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // 2. Create profile entry
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          full_name: fullName,
          role: selectedRole,
          fhir_patient_id: selectedRole === 'patient' ? '592903' : null // Default demo ID
        })

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      router.push(`/dashboard/${selectedRole}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-lime mb-4">
            <Heart className="w-8 h-8 text-bg fill-current" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Join Curaiva<span className="text-brand-lime">AI</span></h1>
          <p className="mt-2 text-text-muted">Create your healthcare intelligence account</p>
        </div>

        <Card className="glass">
          <form onSubmit={handleRegister}>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-light">Full Name</label>
                  <input
                    name="fullName"
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full h-11 px-4 rounded-xl bg-surface border border-border-base focus:border-brand-lime outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-light">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="john@example.com"
                    className="w-full h-11 px-4 rounded-xl bg-surface border border-border-base focus:border-brand-lime outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-light">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-11 px-4 rounded-xl bg-surface border border-border-base focus:border-brand-lime outline-none transition-all"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-text-light">Select Your Role</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={cn(
                        "flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-200",
                        selectedRole === role.id 
                          ? "bg-brand-lime-dim border-brand-lime ring-1 ring-brand-lime" 
                          : "bg-surface border-border-base hover:bg-surface-2"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center mb-3",
                        selectedRole === role.id ? "bg-brand-lime text-bg" : "bg-surface-2 text-text-muted"
                      )}>
                        <role.icon className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-sm block">{role.title}</span>
                      <span className="text-[10px] text-text-muted mt-1 leading-tight">{role.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red/10 border border-red/20 text-red text-sm">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col p-8 pt-0 space-y-4">
              <Button type="submit" className="w-full h-12 text-md" disabled={loading}>
                {loading ? <Spinner size="sm" className="mr-2 border-bg" /> : "Create Account"}
              </Button>
              <p className="text-sm text-center text-text-muted">
                Already have an account?{" "}
                <Link href="/login" className="text-brand-lime hover:underline">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
