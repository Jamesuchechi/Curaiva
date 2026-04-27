"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import Image from "next/image"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const [resent, setResent] = React.useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md text-center space-y-8 animate-in fade-in duration-500">

        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-xl border border-brand-lime/20">
          <Image src="/logo.png" alt="Curaiva Logo" width={64} height={64} className="object-contain" />
        </div>

        {/* Email icon */}
        <div className="relative mx-auto w-28 h-28">
          <div className="w-28 h-28 rounded-3xl bg-teal/10 border border-teal/20 flex items-center justify-center text-6xl animate-in zoom-in-75 duration-500">
            📧
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-3xl border-2 border-teal/30 animate-ping" style={{ animationDuration: "2.5s" }} />
        </div>

        {/* Copy */}
        <div className="space-y-3">
          <h1 className="text-3xl font-display font-bold text-text-white">
            Check Your Inbox
          </h1>
          {email ? (
            <p className="text-text-muted text-sm leading-relaxed">
              We&apos;ve sent a confirmation link to{" "}
              <span className="font-semibold text-brand-lime">{email}</span>.
              <br />
              Click the link to activate your account and access your dashboard.
            </p>
          ) : (
            <p className="text-text-muted text-sm leading-relaxed">
              We&apos;ve sent a confirmation link to your email address.
              Click it to activate your account and access your dashboard.
            </p>
          )}
        </div>

        {/* Steps */}
        <div className="text-left bg-surface border border-border-base rounded-2xl p-5 space-y-4">
          <p className="text-xs font-mono font-bold text-brand-lime uppercase tracking-widest">What to do next</p>
          <ol className="space-y-3">
            {[
              "Open the email from Curaiva AI",
              "Click the \"Confirm your account\" button",
              "You'll be taken straight to your dashboard",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-text-muted">
                <span className="w-5 h-5 rounded-full bg-brand-lime/10 text-brand-lime text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Didn't get it */}
        <div className="space-y-3">
          {resent ? (
            <p className="text-sm text-teal font-medium">✓ Check your spam folder — the email is on its way!</p>
          ) : (
            <p className="text-sm text-text-muted">
              Didn&apos;t receive it?{" "}
              <button
                onClick={() => setResent(true)}
                className="text-brand-lime hover:underline font-medium"
              >
                Check your spam folder
              </button>
              {" "}or{" "}
              <Link href="/register" className="text-brand-lime hover:underline font-medium">
                try a different email
              </Link>.
            </p>
          )}
          <p className="text-xs text-text-muted">
            Already confirmed?{" "}
            <Link href="/login" className="text-brand-lime hover:underline">
              Sign in here →
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <div className="w-6 h-6 border-2 border-brand-lime border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  )
}
