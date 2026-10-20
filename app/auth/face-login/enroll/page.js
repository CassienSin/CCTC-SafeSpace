import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FaceLoginCamera from '@/components/auth/FaceLoginCamera'

export const metadata = {
  title: 'Set up face login | CCTC SafeSpace',
}

export default async function EnrollFaceLoginPage() {
  const client = await createClient()

  const { data, error } = await client.auth.getUser()

  if (error || !data.user) {
    redirect('/login')
  }

  return (
    <FaceLoginCamera
      mode="enroll"
      initialEmail={data.user.email || ''}
    />
  )
}