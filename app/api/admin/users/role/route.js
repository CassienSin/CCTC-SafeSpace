import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/roles'

const allowedRoles = [
  'student',
  'teacher',
  'counselor',
  'admin',
]

export async function PATCH(request) {
  const adminProfile = await getCurrentProfile()

  if (!adminProfile) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (adminProfile.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { userId, role } = body

  if (!userId || !role) {
    return NextResponse.json(
      { error: 'userId and role are required.' },
      { status: 400 }
    )
  }

  if (!allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: 'Invalid role.' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc(
    'admin_update_user_role',
    {
      target_user_id: userId,
      new_role: role,
    }
  )

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
  })
}