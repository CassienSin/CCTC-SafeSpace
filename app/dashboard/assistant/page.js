'use client'

import { useState } from 'react'
import Link from 'next/link'

const initialMessage = {
  role: 'assistant',
  content: 'Hi! I’m SafeSpace Assistant. I can explain how SafeSpace works, help you understand the reporting process, or point you toward support.',
}

const quickPrompts = [
  'How do I report an incident?',
  'What happens after I submit a report?',
  'Can I submit a report anonymously?',
]

export default function SafeSpaceAssistantPage() {
  const [messages, setMessages] = useState([initialMessage])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emergency, setEmergency] = useState(false)

  async function sendMessage(event, preset = null) {
    event?.preventDefault()
    const text = (preset || input).trim()

    if (!text || loading) return

    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Unable to contact SafeSpace Assistant.')

      setMessages((current) => [...current, { role: 'assistant', content: data.reply }])
      setEmergency(Boolean(data.emergency))
    } catch (sendError) {
      setError(sendError.message || 'Unable to contact SafeSpace Assistant.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 pb-28 sm:p-6 lg:min-h-screen lg:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3-.5L4 20l1.5-4A7.5 7.5 0 1 1 20 11.5Z" />
                <path d="M8 12h.01M12 12h.01M16 12h.01" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">SafeSpace Assistant</h1>
              <p className="mt-1 text-sm text-slate-500">A private guide for using SafeSpace and finding support.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="flex min-h-[540px] flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-xl shadow-slate-200/50 backdrop-blur">
            <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-blue-50 px-5 py-4 sm:px-6">
              <p className="text-sm font-bold text-slate-800">How can I help?</p>
              <p className="mt-1 text-xs text-slate-500">Do not share passwords, face data, or unnecessary personal information.</p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-br-md bg-slate-900 text-white' : 'rounded-bl-md bg-slate-100 text-slate-700'}`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {loading && <div className="flex justify-start"><div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm text-slate-500">Thinking...</div></div>}
            </div>

            {emergency && (
              <div className="mx-4 mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 sm:mx-6">
                <p className="text-sm font-bold text-red-800">Need immediate help?</p>
                <p className="mt-1 text-xs leading-5 text-red-700">Contact emergency services or a trusted adult now. You can also submit a SafeSpace incident report.</p>
                <Link href="/dashboard/reports/new" className="mt-3 inline-flex rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-700">Report an Incident</Link>
              </div>
            )}

            {error && <p className="px-5 pb-3 text-sm text-red-600 sm:px-6">{error}</p>}

            <form onSubmit={sendMessage} className="border-t border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} placeholder="Ask SafeSpace Assistant..." className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                <button type="submit" disabled={loading || !input.trim()} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">Send</button>
              </div>
            </form>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800">Try asking</h2>
              <div className="mt-3 space-y-2">
                {quickPrompts.map((prompt) => <button key={prompt} type="button" disabled={loading} onClick={(event) => sendMessage(event, prompt)} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-left text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">{prompt}</button>)}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
              <h2 className="text-sm font-bold text-amber-900">Important</h2>
              <p className="mt-2 text-xs leading-5 text-amber-800">This assistant is not an emergency service, therapist, or investigator. If someone is in immediate danger, contact emergency services and a trusted adult.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
