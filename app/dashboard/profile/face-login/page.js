import { redirect } from 'next/navigation'

export default function FaceLoginSettingsPage() {
  redirect('/auth/face-login/enroll')
}