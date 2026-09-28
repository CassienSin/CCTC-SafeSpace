import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=google_auth_failed', origin),
    )
  }

  const supabase = await createClient()

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(
      new URL('/login?error=google_auth_failed', origin),
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      new URL('/login?error=google_auth_failed', origin),
    )
  }

  // Check whether the user's profile is complete.
  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select('student_id')
      .eq('id', user.id)
      .single()

  if (profileError || !profile?.student_id) {
    return NextResponse.redirect(
      new URL('/complete-profile', origin),
    )
  }

  // Detect Google authentication.
  const providers = user.app_metadata?.providers || []

  const hasGoogleIdentity =
    providers.includes('google') ||
    user.identities?.some(
      (identity) => identity.provider === 'google',
    )

  // This flag is set after the Google user creates a SafeSpace password.
  const passwordConfigured =
    user.user_metadata?.password_configured === true

  if (hasGoogleIdentity && !passwordConfigured) {
    return NextResponse.redirect(
      new URL(
        '/auth/set-password?next=/dashboard',
        origin,
      ),
    )
  }

  return NextResponse.redirect(
    new URL('/dashboard', origin),
  )
}