import { redirect } from 'next/navigation'

export default function LegacyFaceVerificationPage() {
  redirect('/auth/face-login')
}
