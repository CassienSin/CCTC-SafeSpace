    'use client'

    import { Suspense, useEffect, useRef, useState } from 'react'
    import { useRouter, useSearchParams } from 'next/navigation'
    import { createClient } from '@/lib/supabase/client'

    function UnlockForm() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const nextPath = searchParams.get('next')?.startsWith('/')
        ? searchParams.get('next')
        : '/dashboard'

    const supabaseRef = useRef(null)

    if (!supabaseRef.current) {
        supabaseRef.current = createClient()
    }

    const supabase = supabaseRef.current

    const [user, setUser] = useState(null)
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [unlocking, setUnlocking] = useState(false)

    useEffect(() => {
        let active = true

        async function loadUser() {
        const { data, error } = await supabase.auth.getUser()

        if (!active) return

        if (error || !data.user) {
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

    async function unlockWithPassword(event) {
        event.preventDefault()
        setMessage('')
        setUnlocking(true)

        const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
        })

        if (error) {
        setMessage('Password verification failed.')
        setUnlocking(false)
        return
        }

        sessionStorage.setItem(
        'cctc_unlock_at',
        String(Date.now())
        )

        router.replace(nextPath)
        router.refresh()
    }

    async function handleSignOut() {
        await supabase.auth.signOut()
        sessionStorage.removeItem('cctc_unlock_at')
        router.replace('/login')
    }

    if (loading) {
        return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
            Loading...
        </div>
        )
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            🔒
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Unlock SafeSpace
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
            Verify your identity before continuing to your dashboard.
            </p>

            {message && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {message}
            </p>
            )}

            <form
            onSubmit={unlockWithPassword}
            className="mt-6 space-y-3"
            >
            <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />

            <button
                type="submit"
                disabled={unlocking}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {unlocking
                ? 'Verifying...'
                : 'Unlock with Password'}
            </button>
            </form>

            <button
            type="button"
            onClick={() =>
                router.push(
                `/auth/unlock/face?next=${encodeURIComponent(
                    nextPath
                )}`
                )
            }
            className="mt-3 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
            Unlock with Face
            </button>

            <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 w-full text-sm text-slate-500 transition hover:text-slate-800"
            >
            Sign out
            </button>
        </div>
        </main>
    )
    }

    export default function UnlockPage() {
    return (
        <Suspense
        fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
            Loading...
            </div>
        }
        >
        <UnlockForm />
        </Suspense>
    )
    }