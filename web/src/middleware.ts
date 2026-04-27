import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Role-based access control
    // Fetch profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      const role = profile.role
      const path = request.nextUrl.pathname

      // If user tries to access /dashboard but has a specific role, redirect to their role dashboard
      if (path === '/dashboard') {
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
      }

      // Prevent cross-role access (e.g. patient accessing /dashboard/doctor)
      if (path.startsWith('/dashboard/patient') && role !== 'patient') {
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
      }
      if (path.startsWith('/dashboard/doctor') && role !== 'doctor') {
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
      }
      if (path.startsWith('/dashboard/chw') && role !== 'chw') {
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
      }
    }
  }

  // Redirect authenticated users away from login/register
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      return NextResponse.redirect(new URL(`/dashboard/${profile.role}`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
