import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/roles'

export async function DELETE(request) {
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
  const { userId } = body

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required.' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc(
    'admin_delete_user',
    {
      target_user_id: userId,
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