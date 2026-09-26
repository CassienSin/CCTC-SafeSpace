import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const body = await request.json()
  const { recipientId } = body

  if (!recipientId) {
    return NextResponse.json(
      { error: 'recipientId is required.' },
      { status: 400 }
    )
  }

  const { data: conversationId, error } =
    await supabase.rpc(
      'create_conversation',
      {
        recipient_id: recipientId,
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
    conversationId,
  })
}