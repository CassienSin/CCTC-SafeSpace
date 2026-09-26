'use client'

export default function Card({
  children,
  className = '',
}) {
  return (
    <div
      className={`rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  )
}