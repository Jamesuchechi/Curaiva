import Link from "next/link"
import { ShieldOff } from "lucide-react"

export const metadata = {
  title: "Unauthorized — Curaiva AI",
  description: "You do not have permission to access this page.",
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-20 h-20 rounded-2xl bg-red/10 border border-red/20 flex items-center justify-center mx-auto">
          <ShieldOff className="w-10 h-10 text-red" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-text-white mb-2">Access Denied</h1>
          <p className="text-text-muted text-sm leading-relaxed">
            You don&apos;t have permission to access this dashboard. Please sign in with the correct role.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-brand-lime text-bg font-bold text-sm hover:bg-brand-lime/90 transition-colors"
          >
            Sign In with Correct Account
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl border border-border-base text-text-muted font-medium text-sm hover:border-border-base-2 hover:text-text-light transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
