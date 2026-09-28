    'use client'

    import { useEffect, useRef, useState } from 'react'
    import { useRouter, useSearchParams } from 'next/navigation'
    import { createClient } from '@/lib/supabase/client'

    export default function SetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const nextPath = searchParams.get('next')?.startsWith('/')
        ? searchParams.get('next')
        : '/dashboard'

    const supabaseRef = useRef(null)
    if (!supabaseRef.current) supabaseRef.current = createClient()
    const supabase = supabaseRef.current

    const [user, setUser] = useState(null)
    const [password, setPassword] = useState('')
    const [confirmation, setConfirmation] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true

        async function loadUser() {
        const { data, error: userError } = await supabase.auth.getUser()

        if (!active) return

        if (userError || !data.user) {
            router.replace('/login')
            return
        }

        setUser(data.user)
        setLoading(false)
        }

        loadUser()
        return () => {
        active = false
        }
    }, [router, supabase])

    async function handleSubmit(event) {
        event.preventDefault()
        setError('')

        if (password.length < 8) {
        setError('Your password must contain at least 8 characters.')
        return
        }

        if (password !== confirmation) {
        setError('The passwords do not match.')
        return
        }

        setSaving(true)

        const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: {
            ...(user?.user_metadata || {}),
            password_configured: true,
        },
        })

        if (updateError) {
        setError(updateError.message || 'Unable to create your password.')
        setSaving(false)
        return
        }

        sessionStorage.setItem('cctc_unlock_at', String(Date.now()))
        router.replace(nextPath)
        router.refresh()
    }

    async function signOut() {
        await supabase.auth.signOut()
        sessionStorage.removeItem('cctc_unlock_at')
        router.replace('/login')
    }

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading...</div>
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Create your SafeSpace password</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
            Your Google account signed you in successfully. Create a SafeSpace password so you have a second way to secure and recover your account.
            </p>

            {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
                New password
                <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
                Confirm password
                <input
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
            </label>

            <button type="submit" disabled={saving} className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? 'Saving password...' : 'Create Password'}
            </button>
            </form>

            <button type="button" onClick={signOut} className="mt-5 w-full text-sm font-medium text-slate-500 transition hover:text-slate-800">
            Sign out instead
            </button>
        </div>
        </main>
    )
    }
