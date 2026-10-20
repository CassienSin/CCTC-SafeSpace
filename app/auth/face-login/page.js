import FaceLoginCamera from '@/components/auth/FaceLoginCamera'

export const metadata = {
  title: 'Face login | CCTC SafeSpace',
}

function localReturnPath(value) {
  if (typeof value !== 'string') return '/dashboard'
  try {
    const base = 'https://safespace.local'
    const target = new URL(value, base)
    if (target.origin !== base) return '/dashboard'
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return '/dashboard'
  }
}

export default async function FaceLoginPage({ searchParams }) {
  const params = await searchParams
  return <FaceLoginCamera successPath={localReturnPath(params?.next)} />
}
