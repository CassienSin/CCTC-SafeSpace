'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function BrandLogo({
  showTagline = true,
  compact = false,
}) {
  return (
    <Link
      href="/dashboard"
      className="group flex items-center gap-3"
    >
      {/* School Logo */}
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl border border-white/80 bg-white shadow-sm ${
          compact ? 'h-9 w-9' : 'h-11 w-11'
        }`}
      >
        <Image
          src="/school-logo.png"
          alt="School Logo"
          fill
          sizes={compact ? '36px' : '44px'}
          className="object-contain p-1"
          priority
        />
      </div>

      {/* App Name */}
      <div className="min-w-0">
        <p
          className={`truncate font-bold tracking-tight text-slate-900 ${
            compact ? 'text-sm' : 'text-base'
          }`}
        >
          CCTC SafeSpace
        </p>

        {showTagline && !compact && (
          <p className="truncate text-[11px] font-medium text-slate-500">
            Student Safety & Support
          </p>
        )}
      </div>
    </Link>
  )
}