'use client'

import { Suspense } from 'react'
import FaceVerificationPage from '@/app/dashboard/profile/face-auth/verify/page'

function LoadingFaceVerification() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-sm text-white">
      Loading face verification...
    </main>
  )
}

export default function FaceUnlockPage() {
  return (
    <Suspense fallback={<LoadingFaceVerification />}>
      <FaceVerificationPage unlockMode />
    </Suspense>
  )
}