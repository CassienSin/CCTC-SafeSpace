'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

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
      <path d="M8 11h.01" />
      <path d="M12 11h.01" />
      <path d="M16 11h.01" />
    </svg>
  )
}

function SearchIcon({ className = 'h-5 w-5' }) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  )
}

function PlusIcon({ className = 'h-5 w-5' }) {
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function UserIcon({ className = 'h-5 w-5' }) {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  )
}

function formatTime(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()

  const sameDay =
    date.toDateString() === now.toDateString()

  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
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

  if (role === 'admin') {
    return 'from-slate-600 to-slate-800'
  }

  return 'from-blue-600 to-indigo-600'
}

export default function MessagesPage() {
  const supabase = createClient()

  const [currentUserId, setCurrentUserId] =
    useState(null)

  const [conversations, setConversations] =
    useState([])

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  async function loadConversations(userId) {
    if (!userId) return

    try {
      setError('')

      const { data: participantRows, error: participantError } =
        await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', userId)

      if (participantError) {
        throw participantError
      }

      const conversationIds =
        participantRows?.map(
          (row) => row.conversation_id
        ) || []

      if (conversationIds.length === 0) {
        setConversations([])
        return
      }

      const { data: conversationRows, error: conversationError } =
        await supabase
          .from('conversations')
          .select(
            'id, created_at, updated_at'
          )
          .in('id', conversationIds)
          .order('updated_at', {
            ascending: false,
          })

      if (conversationError) {
        throw conversationError
      }

      const { data: participants, error: peopleError } =
        await supabase
          .from('conversation_participants')
          .select(
            'conversation_id, user_id'
          )
          .in(
            'conversation_id',
            conversationIds
          )

      if (peopleError) {
        throw peopleError
      }

      const otherUserIds =
        participants
          ?.filter(
            (participant) =>
              participant.user_id !== userId
          )
          .map(
            (participant) =>
              participant.user_id
          ) || []

      const { data: profiles, error: profilesError } =
        await supabase
          .from('profiles')
          .select(
            'id, full_name, role, avatar_url'
          )
          .in(
            'id',
            otherUserIds
          )

      if (profilesError) {
        throw profilesError
      }

      const { data: messages, error: messagesError } =
        await supabase
          .from('messages')
          .select(
            'id, conversation_id, sender_id, content, created_at, read_at'
          )
          .in(
            'conversation_id',
            conversationIds
          )
          .order('created_at', {
            ascending: false,
          })

      if (messagesError) {
        throw messagesError
      }

      const conversationData =
        conversationRows?.map((conversation) => {
          const participant =
            participants?.find(
              (item) =>
                item.conversation_id ===
                  conversation.id &&
                item.user_id !== userId
            )

          const profile =
            profiles?.find(
              (item) =>
                item.id === participant?.user_id
            )

          const latestMessage =
            messages?.find(
              (message) =>
                message.conversation_id ===
                conversation.id
            )

          const unreadCount =
            messages?.filter(
              (message) =>
                message.conversation_id ===
                  conversation.id &&
                message.sender_id !== userId &&
                !message.read_at
            ).length || 0

          return {
            id: conversation.id,
            otherUser: profile || {
              id: participant?.user_id,
              full_name: 'Unknown User',
              role: 'student',
              avatar_url: null,
            },
            latestMessage,
            unreadCount,
            updatedAt:
              latestMessage?.created_at ||
              conversation.updated_at ||
              conversation.created_at,
          }
        }) || []

      conversationData.sort(
        (a, b) =>
          new Date(b.updatedAt) -
          new Date(a.updatedAt)
      )

      setConversations(conversationData)
    } catch (err) {
      console.error(
        'Failed to load conversations:',
        err
      )

      setError(
        'Unable to load your conversations.'
      )
    }
  }

  useEffect(() => {
    async function initialize() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          setLoading(false)
          return
        }

        setCurrentUserId(user.id)

        await loadConversations(user.id)
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [])

  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel(
        `messages-inbox-${currentUserId}`
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const message = payload.new

          const belongsToConversation =
            conversations.some(
              (conversation) =>
                conversation.id ===
                message.conversation_id
            )

          if (!belongsToConversation) {
            await loadConversations(
              currentUserId
            )
            return
          }

          setConversations((previous) => {
            return previous
              .map((conversation) => {
                if (
                  conversation.id !==
                  message.conversation_id
                ) {
                  return conversation
                }

                const isOwnMessage =
                  message.sender_id ===
                  currentUserId

                return {
                  ...conversation,
                  latestMessage: message,
                  updatedAt:
                    message.created_at,
                  unreadCount:
                    isOwnMessage
                      ? conversation.unreadCount
                      : conversation.unreadCount + 1,
                }
              })
              .sort(
                (a, b) =>
                  new Date(b.updatedAt) -
                  new Date(a.updatedAt)
              )
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [
    currentUserId,
    conversations.length,
  ])

  const filteredConversations = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase()

    if (!query) {
      return conversations
    }

    return conversations.filter(
      (conversation) => {
        const name =
          conversation.otherUser?.full_name ||
          ''

        const message =
          conversation.latestMessage?.content ||
          ''

        return (
          name
            .toLowerCase()
            .includes(query) ||
          message
            .toLowerCase()
            .includes(query)
        )
      }
    )
  }, [conversations, search])

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:min-h-screen lg:p-8">

      <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-6xl flex-col lg:h-[calc(100vh-4rem)]">

        {/* Header */}
        <div className="mb-5 flex shrink-0 items-center justify-between">

          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <MessageIcon />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Messages
                </h1>

                <p className="mt-0.5 text-sm text-slate-500">
                  Private conversations with your support team.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/messages/new"
            className="hidden sm:block"
          >
            <Button>
              <span className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                New message
              </span>
            </Button>
          </Link>

        </div>

        {/* Main Messenger card */}
        <Card className="flex min-h-0 flex-1 overflow-hidden">

          {/* Conversation list */}
          <section className="flex min-h-0 w-full flex-col lg:w-[380px] lg:border-r lg:border-slate-200/80">

            {/* Search header */}
            <div className="border-b border-slate-200/80 p-4">

              <div className="relative">
                <SearchIcon className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search conversations..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Conversations
                </p>

                <Link
                  href="/dashboard/messages/new"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50"
                  title="New message"
                >
                  <PlusIcon className="h-5 w-5" />
                </Link>
              </div>

            </div>

            {/* Conversation list */}
            <div className="min-h-0 flex-1 overflow-y-auto">

              {loading && (
                <div className="space-y-2 p-4">
                  {[1, 2, 3, 4].map(
                    (item) => (
                      <div
                        key={item}
                        className="flex animate-pulse items-center gap-3 rounded-xl p-3"
                      >
                        <div className="h-12 w-12 rounded-full bg-slate-200" />

                        <div className="flex-1">
                          <div className="h-3 w-28 rounded bg-slate-200" />
                          <div className="mt-2 h-3 w-40 rounded bg-slate-100" />
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {!loading &&
                error && (
                  <div className="p-6 text-center">
                    <p className="text-sm font-semibold text-red-600">
                      {error}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        loadConversations(
                          currentUserId
                        )
                      }
                      className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Try again
                    </button>
                  </div>
                )}

              {!loading &&
                !error &&
                filteredConversations.length ===
                  0 && (
                  <div className="flex h-full flex-col items-center justify-center px-8 py-12 text-center">

                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                      <MessageIcon className="h-7 w-7" />
                    </div>

                    <h2 className="mt-4 text-base font-bold text-slate-800">
                      {search
                        ? 'No conversations found'
                        : 'No messages yet'}
                    </h2>

                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                      {search
                        ? 'Try searching for a different name or message.'
                        : 'Start a private conversation with a teacher or counselor when you need support.'}
                    </p>

                    {!search && (
                      <Link
                        href="/dashboard/messages/new"
                        className="mt-5"
                      >
                        <Button>
                          <span className="flex items-center gap-2">
                            <PlusIcon className="h-4 w-4" />
                            Start a conversation
                          </span>
                        </Button>
                      </Link>
                    )}

                  </div>
                )}

              {!loading &&
                filteredConversations.map(
                  (conversation) => {
                    const name =
                      conversation.otherUser
                        ?.full_name ||
                      'Unknown User'

                    const role =
                      conversation.otherUser
                        ?.role || 'student'

                    const latestMessage =
                      conversation.latestMessage

                    const unread =
                      conversation.unreadCount >
                      0

                    return (
                      <Link
                        key={conversation.id}
                        href={`/dashboard/messages/${conversation.id}`}
                        className={`group flex items-center gap-3 border-b border-slate-100 px-4 py-4 transition-colors ${
                          unread
                            ? 'bg-blue-50/60'
                            : 'hover:bg-slate-50'
                        }`}
                      >

                        {/* Avatar */}
                        <div className="relative shrink-0">

                          {conversation.otherUser
                            ?.avatar_url ? (
                            <img
                              src={
                                conversation
                                  .otherUser
                                  .avatar_url
                              }
                              alt={name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-sm ${getAvatarStyle(
                                role
                              )}`}
                            >
                              {getInitials(name)}
                            </div>
                          )}

                          {/* Online-style indicator */}
                          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />

                        </div>

                        {/* Message preview */}
                        <div className="min-w-0 flex-1">

                          <div className="flex items-center justify-between gap-3">

                            <p
                              className={`truncate text-sm ${
                                unread
                                  ? 'font-bold text-slate-900'
                                  : 'font-semibold text-slate-700'
                              }`}
                            >
                              {name}
                            </p>

                            <span
                              className={`shrink-0 text-[10px] ${
                                unread
                                  ? 'font-bold text-blue-600'
                                  : 'font-medium text-slate-400'
                              }`}
                            >
                              {formatTime(
                                conversation.updatedAt
                              )}
                            </span>

                          </div>

                          <div className="mt-1 flex items-center gap-2">

                            <p
                              className={`min-w-0 flex-1 truncate text-xs ${
                                unread
                                  ? 'font-semibold text-slate-700'
                                  : 'text-slate-500'
                              }`}
                            >
                              {latestMessage?.content ||
                                'No messages yet'}
                            </p>

                            {unread && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                                {conversation.unreadCount >
                                99
                                  ? '99+'
                                  : conversation.unreadCount}
                              </span>
                            )}

                          </div>

                          <p className="mt-1 text-[10px] font-medium capitalize text-slate-400">
                            {role}
                          </p>

                        </div>

                      </Link>
                    )
                  }
                )}

            </div>
          </section>

          {/* Desktop empty state */}
          <section className="hidden min-w-0 flex-1 items-center justify-center bg-slate-50/40 lg:flex">

            <div className="max-w-sm px-8 text-center">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-blue-500 shadow-sm ring-1 ring-slate-200/70">
                <MessageIcon className="h-9 w-9" />
              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-800">
                Your conversations
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Select a conversation to continue chatting,
                or start a new private conversation with a
                teacher or counselor.
              </p>

              <Link
                href="/dashboard/messages/new"
                className="mt-5 inline-block"
              >
                <Button>
                  <span className="flex items-center gap-2">
                    <PlusIcon className="h-4 w-4" />
                    New conversation
                  </span>
                </Button>
              </Link>

            </div>

          </section>

        </Card>
      </div>
    </div>
  )
}