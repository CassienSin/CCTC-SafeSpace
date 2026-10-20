import { redirect } from 'next/navigation'

export default function LegacyFaceEnrollmentPage() {
  redirect('/dashboard/profile/face-login')
}
