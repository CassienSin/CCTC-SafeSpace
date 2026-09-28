import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function proxy(request) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, ...options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isLandingPage = pathname === '/'
  const isDashboard = pathname.startsWith('/dashboard')
  const isLogin = pathname === '/login'
  const isRegister = pathname === '/register'
  const isSetPassword = pathname.startsWith('/auth/set-password')
  const isCompleteProfile = pathname.startsWith('/complete-profile')
  const isAuthenticationPage = isLandingPage || isLogin || isRegister

  if (isDashboard && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const providers = user.app_metadata?.providers || []
    const signedInWithGoogle =
      user.app_metadata?.provider === 'google' || providers.includes('google')
    const passwordConfigured = user.user_metadata?.password_configured === true

    // Google users must configure a password before using protected pages.
    if (signedInWithGoogle && !passwordConfigured && isDashboard) {
      return NextResponse.redirect(
        new URL('/auth/set-password?next=/dashboard', request.url),
      )
    }

    // Do not redirect users away from the setup pages themselves.
    if (!isSetPassword && !isCompleteProfile && isAuthenticationPage) {
      if (signedInWithGoogle && !passwordConfigured) {
        return NextResponse.redirect(
          new URL('/auth/set-password?next=/dashboard', request.url),
        )
      }

      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/login',
    '/register',
    '/auth/set-password',
    '/complete-profile',
  ],
}
