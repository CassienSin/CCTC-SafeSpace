import { createClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function getCurrentProfile() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return null
  }

  return profile
}

export async function getCurrentRole() {
  const profile = await getCurrentProfile()

  return profile?.role || null
}

export async function hasRole(allowedRoles) {
  const role = await getCurrentRole()

  if (!role) {
    return false
  }

  return allowedRoles.includes(role)
}