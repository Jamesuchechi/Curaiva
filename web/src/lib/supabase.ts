import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === "undefined") return []
          return document.cookie.split("; ").map((cookie) => {
            const [name, ...value] = cookie.split("=")
            let val = value.join("=")
            // Handle double-quoting fix
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.substring(1, val.length - 1)
            }
            return { name, value: decodeURIComponent(val) }
          })
        },
        setAll(cookiesToSet) {
          if (typeof document === "undefined") return
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${encodeURIComponent(value)}`
            if (options.path) cookieString += `; path=${options.path}`
            if (options.maxAge) cookieString += `; max-age=${options.maxAge}`
            if (options.domain) cookieString += `; domain=${options.domain}`
            if (options.secure) cookieString += `; secure`
            if (options.sameSite) cookieString += `; samesite=${options.sameSite}`
            document.cookie = cookieString
          })
        },
      },
    }
  )
}
