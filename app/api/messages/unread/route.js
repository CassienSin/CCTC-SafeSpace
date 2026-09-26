import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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

  const { data: conversations, error: conversationError } =
    await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)

  if (conversationError) {
    return NextResponse.json(
      { error: conversationError.message },
      { status: 500 }
    )
  }

  const conversationIds =
    conversations?.map(
      (conversation) => conversation.conversation_id
    ) || []

  if (conversationIds.length === 0) {
    return NextResponse.json({
      count: 0,
    })
  }

  const { count, error: messageError } =
    await supabase
      .from('messages')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .in('conversation_id', conversationIds)
      .neq('sender_id', user.id)
      .is('read_at', null)

  if (messageError) {
    return NextResponse.json(
      { error: messageError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    count: count || 0,
  })
}