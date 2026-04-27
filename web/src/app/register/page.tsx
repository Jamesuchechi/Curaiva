"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Spinner } from "@/components/ui/loading"
import { User, Stethoscope, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

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

  /* ── Auth guard: already logged in → go straight to dashboard ── */
  React.useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Fetch their role so we send them to the right dashboard
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        router.replace(`/dashboard/${profile?.role ?? 'patient'}`)
      }
    }
    checkSession()
  }, [supabase, router])

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string

    // 1. Sign up — pass role + name in metadata so the DB trigger can read them
    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          role: selectedRole,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // 2. If identities is empty — account already exists and is verified.
    //    Don't leave them on the register page with a spinner. Send them to login
    //    with a friendly message pre-filled.
    if (data.user && data.user.identities?.length === 0) {
      router.push('/login?notice=already_registered')
      return
    }

    // 3. Email confirmation required (user created but no active session yet)
    if (data.user && !data.session) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
        role: selectedRole,
        fhir_patient_id: selectedRole === "patient" ? "592903" : null,
      })
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
      return
    }

    // 4. Email confirmation disabled — user is immediately active
    if (data.user && data.session) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
        role: selectedRole,
        fhir_patient_id: selectedRole === "patient" ? "592903" : null,
      })

      if (profileError && !profileError.message?.includes("duplicate")) {
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl overflow-hidden bg-white shadow-lg border border-brand-lime/20 mb-6">
            <Image 
              src="/logo.png" 
              alt="Curaiva Logo" 
              width={64} 
              height={64} 
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Join Curaiva<span className="text-brand-lime">AI</span></h1>
          <p className="mt-2 text-text-muted font-medium">Create your healthcare intelligence account</p>
        </div>

        <Card className="glass">
          <form onSubmit={handleRegister}>
            <CardContent className="p-6 sm:p-8 space-y-6">
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
            <CardFooter className="flex flex-col p-6 sm:p-8 pt-0 space-y-4">
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
