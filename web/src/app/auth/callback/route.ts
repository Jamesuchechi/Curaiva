import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Try to get the profile row
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (profile?.role) {
          // Happy path: profile already exists
          return NextResponse.redirect(`${origin}/dashboard/${profile.role}`)
        }

        // Profile doesn't exist yet (insert failed before email confirmation,
        // or tables haven't been migrated). Reconstruct it from user_metadata
        // which we stored during signUp.
        const meta = user.user_metadata ?? {}
        const role: string = (meta.role as string) || "patient"
        const fullName: string = (meta.full_name as string) || ""

        // Upsert so we don't fail if there's a partial row
        await supabase.from("profiles").upsert({
          id: user.id,
          full_name: fullName,
          role,
          fhir_patient_id: role === "patient" ? "592903" : null,
        })

        return NextResponse.redirect(`${origin}/dashboard/${role}`)
      }

      // User object missing — send to login rather than landing page
      return NextResponse.redirect(`${origin}/login`)
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
