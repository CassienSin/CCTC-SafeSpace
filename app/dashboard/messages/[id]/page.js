'use client'

import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'

function ArrowLeftIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function SendIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}

function MessageIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-4-.9L4 20l1.5-3.3A7.4 7.4 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" />
    </svg>
  )
}

function getInitials(name) {
  if (!name) return 'U'

  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getAvatarStyle(role) {
  if (role === 'counselor') {
    return 'from-violet-500 to-purple-600'
  }

  if (role === 'teacher') {
    return 'from-blue-500 to-cyan-600'
  }

  return 'from-slate-500 to-slate-700'
}

function formatMessageTime(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatMessageDate(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)
  const today = new Date()

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (
    date.toDateString() === today.toDateString()
  ) {
    return 'Today'
  }

  if (
    date.toDateString() ===
    yesterday.toDateString()
  ) {
    return 'Yesterday'
  }

  return date.toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()

  const conversationId = params.id

  const supabase = createClient()

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const [currentUserId, setCurrentUserId] =
    useState(null)

  const [otherUser, setOtherUser] =
    useState(null)

  const [messages, setMessages] = useState([])

  const [messageText, setMessageText] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [sending, setSending] =
    useState(false)

  const [error, setError] =
    useState('')

  async function markMessagesAsRead(
    userId,
    conversationMessages = []
  ) {
    if (!userId) return

    const unreadIds =
      conversationMessages
        .filter(
          (message) =>
            message.sender_id !== userId &&
            !message.read_at
        )
        .map((message) => message.id)

    if (unreadIds.length > 0) {
      await supabase
        .from('messages')
        .update({
          read_at: new Date().toISOString(),
        })
        .in('id', unreadIds)
    }

    await supabase
      .from('notifications')
      .update({
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('conversation_id', conversationId)
      .eq('type', 'message')
      .is('read_at', null)
  }

  async function loadConversation() {
    try {
      setError('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      setCurrentUserId(user.id)

      const { data: participantRows, error: participantError } =
        await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId)

      if (participantError) {
        throw participantError
      }

      const participantIds =
        participantRows?.map(
          (participant) => participant.user_id
        ) || []

      if (!participantIds.includes(user.id)) {
        router.push('/dashboard/messages')
        return
      }

      const otherUserId = participantIds.find(
        (id) => id !== user.id
      )

      if (!otherUserId) {
        throw new Error(
          'Conversation participant not found.'
        )
      }

      const { data: profile, error: profileError } =
        await supabase
          .from('profiles')
          .select(
            'id, full_name, role, avatar_url'
          )
          .eq('id', otherUserId)
          .single()

      if (profileError) {
        throw profileError
      }

      setOtherUser(profile)

      const { data: messageRows, error: messageError } =
        await supabase
          .from('messages')
          .select(
            'id, conversation_id, sender_id, content, created_at, read_at'
          )
          .eq(
            'conversation_id',
            conversationId
          )
          .order('created_at', {
            ascending: true,
          })

      if (messageError) {
        throw messageError
      }

      const loadedMessages =
        messageRows || []

      setMessages(loadedMessages)

      await markMessagesAsRead(
        user.id,
        loadedMessages
      )
    } catch (err) {
      console.error(
        'Failed to load conversation:',
        err
      )

      setError(
        err.message ||
          'Unable to load this conversation.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!conversationId) return

    loadConversation()
  }, [conversationId])

  useEffect(() => {
    if (!currentUserId || !conversationId) {
      return
    }

    const channel = supabase
      .channel(
        `conversation-${conversationId}`
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const incomingMessage =
            payload.new

          setMessages((current) => {
            const exists = current.some(
              (message) =>
                message.id ===
                incomingMessage.id
            )

            if (exists) {
              return current
            }

            return [
              ...current,
              incomingMessage,
            ]
          })

          if (
            incomingMessage.sender_id !==
            currentUserId
          ) {
            await supabase
              .from('messages')
              .update({
                read_at:
                  new Date().toISOString(),
              })
              .eq(
                'id',
                incomingMessage.id
              )

            await supabase
              .from('notifications')
              .update({
                read_at:
                  new Date().toISOString(),
              })
              .eq(
                'user_id',
                currentUserId
              )
              .eq(
                'conversation_id',
                conversationId
              )
              .eq(
                'type',
                'message'
              )
              .is(
                'read_at',
                null
              )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [
    currentUserId,
    conversationId,
  ])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages])

  async function sendMessage() {
    const content =
      messageText.trim()

    if (
      !content ||
      !currentUserId ||
      sending
    ) {
      return
    }

    try {
      setSending(true)
      setError('')

      const { data, error } =
        await supabase
          .from('messages')
          .insert({
            conversation_id:
              conversationId,
            sender_id:
              currentUserId,
            content,
          })
          .select()
          .single()

      if (error) {
        throw error
      }

      setMessages((current) => {
        const exists = current.some(
          (message) =>
            message.id === data.id
        )

        if (exists) {
          return current
        }

        return [
          ...current,
          data,
        ]
      })

      setMessageText('')

      if (textareaRef.current) {
        textareaRef.current.style.height =
          'auto'
      }
    } catch (err) {
      console.error(
        'Failed to send message:',
        err
      )

      setError(
        err.message ||
          'Unable to send your message.'
      )
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault()
      sendMessage()
    }
  }

  function handleTextareaChange(event) {
    setMessageText(event.target.value)

    const textarea =
      textareaRef.current

    if (!textarea) return

    textarea.style.height = 'auto'

    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      140
    )}px`
  }

  function groupMessagesByDate() {
    const groups = []

    messages.forEach((message) => {
      const label =
        formatMessageDate(
          message.created_at
        )

      let group =
        groups[groups.length - 1]

      if (
        !group ||
        group.label !== label
      ) {
        group = {
          label,
          messages: [],
        }

        groups.push(group)
      }

      group.messages.push(message)
    })

    return groups
  }

  const groupedMessages =
    groupMessagesByDate()

  const displayName =
    otherUser?.full_name ||
    'School Staff'

  const displayRole =
    otherUser?.role ||
    'staff'

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col lg:h-screen lg:p-6">

      {/* Desktop wrapper */}
      <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 flex-col lg:overflow-hidden lg:rounded-3xl lg:border lg:border-white/70 lg:bg-white/85 lg:shadow-xl lg:shadow-slate-900/5 lg:backdrop-blur-xl">

        {/* Header */}
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-5">

          <Link
            href="/dashboard/messages"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Back to messages"
          >
            <ArrowLeftIcon />
          </Link>

          {/* Avatar */}
          {otherUser?.avatar_url ? (
            <img
              src={otherUser.avatar_url}
              alt={displayName}
              className="h-11 w-11 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-sm ${getAvatarStyle(
                displayRole
              )}`}
            >
              {getInitials(displayName)}
            </div>
          )}

          {/* Person */}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">
              {displayName}
            </h1>

            <p className="mt-0.5 text-xs font-medium capitalize text-slate-500">
              {displayRole}
            </p>
          </div>

        </header>

        {/* Error */}
        {error && (
          <div className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-3 py-4 sm:px-5 lg:px-8">

          {/* Loading */}
          {loading && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading conversation...
                </p>
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading &&
            messages.length === 0 && (
              <div className="flex h-full items-center justify-center">

                <div className="max-w-sm text-center">

                  <div
                    className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-lg font-bold text-white shadow-lg ${getAvatarStyle(
                      displayRole
                    )}`}
                  >
                    {getInitials(displayName)}
                  </div>

                  <h2 className="mt-4 text-lg font-bold text-slate-800">
                    Start a conversation
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Send a message to{' '}
                    <span className="font-semibold text-slate-700">
                      {displayName}
                    </span>{' '}
                    whenever you need support.
                  </p>

                </div>

              </div>
            )}

          {/* Message groups */}
          {!loading &&
            groupedMessages.length > 0 && (
              <div className="mx-auto max-w-3xl space-y-6">

                {groupedMessages.map(
                  (group) => (
                    <div key={group.label}>

                      {/* Date */}
                      <div className="mb-5 flex items-center justify-center">
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-400 shadow-sm">
                          {group.label}
                        </span>
                      </div>

                      {/* Messages */}
                      <div className="space-y-2.5">

                        {group.messages.map(
                          (message) => {
                            const isMine =
                              message.sender_id ===
                              currentUserId

                            return (
                              <div
                                key={message.id}
                                className={`flex ${
                                  isMine
                                    ? 'justify-end'
                                    : 'justify-start'
                                }`}
                              >

                                <div
                                  className={`max-w-[82%] sm:max-w-[70%]`}
                                >

                                  <div
                                    className={`rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm ${
                                      isMine
                                        ? 'rounded-br-md bg-blue-600 text-white'
                                        : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'
                                    }`}
                                  >
                                    {message.content}
                                  </div>

                                  <div
                                    className={`mt-1 px-1 text-[10px] font-medium text-slate-400 ${
                                      isMine
                                        ? 'text-right'
                                        : 'text-left'
                                    }`}
                                  >
                                    {formatMessageTime(
                                      message.created_at
                                    )}

                                    {isMine &&
                                      message.read_at && (
                                        <span className="ml-1 text-blue-500">
                                          • Read
                                        </span>
                                      )}
                                  </div>

                                </div>

                              </div>
                            )
                          }
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          <div ref={messagesEndRef} />

        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-slate-200/80 bg-white p-3 sm:p-4">

          <div className="mx-auto max-w-3xl">

            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">

              <textarea
                ref={textareaRef}
                value={messageText}
                onChange={
                  handleTextareaChange
                }
                onKeyDown={
                  handleKeyDown
                }
                placeholder="Write a message..."
                rows={1}
                disabled={
                  loading ||
                  sending
                }
                className="max-h-[140px] min-h-[42px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50"
              />

              <button
                type="button"
                onClick={sendMessage}
                disabled={
                  !messageText.trim() ||
                  sending ||
                  loading
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                aria-label="Send message"
              >
                {sending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <SendIcon className="h-4 w-4" />
                )}
              </button>

            </div>

            <p className="mt-2 hidden text-center text-[10px] text-slate-400 sm:block">
              Press Enter to send • Shift + Enter for a new line
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}