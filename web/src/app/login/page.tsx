"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Spinner } from "@/components/ui/loading"
import Image from "next/image"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const notice = searchParams.get("notice")

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const { error: authError, data } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single()

    router.push(`/dashboard/${profile?.role ?? "patient"}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-xl border border-brand-lime/20 mb-6">
            <Image src="/logo.png" alt="Curaiva Logo" width={80} height={80} className="object-contain" />
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight">
            Curaiva<span className="text-brand-lime">AI</span>
          </h1>
          <p className="mt-2 text-text-muted font-medium tracking-wide">The Healthcare Intelligence Superpower</p>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-light">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full h-11 px-4 rounded-xl bg-surface border border-border-base focus:border-brand-lime outline-none transition-all"
                />
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

              {/* Notice from register redirect */}
              {notice === "already_registered" && (
                <div className="p-3 rounded-lg bg-teal/10 border border-teal/20 text-teal text-sm flex items-start gap-2">
                  <span className="shrink-0">✓</span>
                  <span>You already have an account with that email. Sign in below to continue.</span>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red/10 border border-red/20 text-red text-sm">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Spinner size="sm" className="mr-2 border-bg" /> : "Sign In"}
              </Button>
              <p className="text-sm text-text-muted">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-brand-lime hover:underline">
                  Register now
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

/* useSearchParams requires a Suspense boundary in Next.js App Router */
export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <div className="w-6 h-6 border-2 border-brand-lime border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  )
}
