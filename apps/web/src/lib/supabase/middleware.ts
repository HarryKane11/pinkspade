import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip auth if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Use getUser() not getSession() — getUser() validates the
  // token with the Supabase Auth server, while getSession() reads from
  // cookies which can be tampered with.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes: redirect unauthenticated users to login
  const protectedPrefixes = ['/studio', '/workspace', '/brand-dna', '/onboarding']
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  )

  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect unonboarded users from app routes to onboarding
  if (user && !request.nextUrl.pathname.startsWith('/onboarding')) {
    const appPrefixes = ['/studio', '/workspace', '/brand-dna']
    const isAppRoute = appPrefixes.some((prefix) =>
      request.nextUrl.pathname.startsWith(prefix)
    )

    if (isAppRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      if (profile && !profile.onboarding_completed) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }
  }

  // Redirect authenticated users away from login page
  if (request.nextUrl.pathname === '/login' && user) {
    const next = request.nextUrl.searchParams.get('next') || '/workspace'
    return NextResponse.redirect(new URL(next, request.url))
  }

  return supabaseResponse
}
