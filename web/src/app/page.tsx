"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Spinner } from "@/components/ui/loading"
import { LandingNavbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Architecture } from "@/components/landing/architecture"
import { Security } from "@/components/landing/security"
import { LiveDemo } from "@/components/landing/live-demo"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!loading && user && profile) {
      // Role-based redirection
      if (profile.role === 'doctor') {
        router.push('/dashboard/doctor')
      } else if (profile.role === 'chw') {
        router.push('/dashboard/chw')
      } else {
        router.push('/dashboard/patient')
      }
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Spinner size="lg" className="border-brand-lime" />
      </div>
    )
  }

  // If user is logged in, we are redirecting, so show nothing or a loader
  if (user && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Spinner size="lg" className="border-brand-lime" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-bg">
      <LandingNavbar />
      <Hero />
      <LiveDemo />
      <Architecture />
      <Features />
      <Security />
      <Footer />
    </main>
  )
}
