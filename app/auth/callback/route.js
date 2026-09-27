import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=google_auth_failed', origin)
    )
  }

  const supabase = await createClient()

  const { error } =
    await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=google_auth_failed', origin)
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      new URL('/login?error=google_auth_failed', origin)
    )
  }

  // Check the user's profile
  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select('student_id')
      .eq('id', user.id)
      .single()

  if (profileError || !profile?.student_id) {
    return NextResponse.redirect(
      new URL('/complete-profile', origin)
    )
  }

  return NextResponse.redirect(
    new URL('/dashboard', origin)
  )
}