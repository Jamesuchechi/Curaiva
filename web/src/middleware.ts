import { createServerClient } from '@supabase/ssr'
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
        getAll() {
          return request.cookies.getAll().map(cookie => {
            let value = cookie.value
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.substring(1, value.length - 1)
            }
            return { ...cookie, value }
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      const role = profile.role
      const path = request.nextUrl.pathname

      if (path === '/dashboard') {
        const url = request.nextUrl.clone()
        url.pathname = `/dashboard/${role}`
        return NextResponse.redirect(url)
      }

      if (path.startsWith('/dashboard/patient') && role !== 'patient') {
        const url = request.nextUrl.clone()
        url.pathname = `/dashboard/${role}`
        return NextResponse.redirect(url)
      }
      if (path.startsWith('/dashboard/doctor') && role !== 'doctor') {
        const url = request.nextUrl.clone()
        url.pathname = `/dashboard/${role}`
        return NextResponse.redirect(url)
      }
      if (path.startsWith('/dashboard/chw') && role !== 'chw') {
        const url = request.nextUrl.clone()
        url.pathname = `/dashboard/${role}`
        return NextResponse.redirect(url)
      }
    }
  }

  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      const url = request.nextUrl.clone()
      url.pathname = `/dashboard/${profile.role}`
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
