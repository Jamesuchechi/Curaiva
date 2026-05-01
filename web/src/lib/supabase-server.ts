import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(cookie => {
            let value = cookie.value
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.substring(1, value.length - 1)
            }
            return { ...cookie, value }
          })
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options })
            )
          } catch {
          }
        },
      },
    }
  )
}
