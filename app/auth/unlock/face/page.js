import { redirect } from 'next/navigation'

export default async function FaceUnlockPage({ searchParams }) {
  const params = await searchParams
  const requested = params?.next
  let next = '/dashboard'
  if (typeof requested === 'string') {
    try {
      const base = 'https://safespace.local'
      const target = new URL(requested, base)
      if (target.origin === base) next = `${target.pathname}${target.search}${target.hash}`
    } catch {}
  }
  redirect(`/auth/face-login?next=${encodeURIComponent(next)}`)
}
