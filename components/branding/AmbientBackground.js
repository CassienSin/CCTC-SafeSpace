'use client'

export default function AmbientBackground({
  children,
  className = '',
}) {
  return (
    <div
      className={`relative min-h-screen bg-slate-50 ${className}`}
    >
      {/* Fixed background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"
      >
        {/* Background image */}
        <div
          className="absolute -inset-6 scale-105 bg-cover bg-center bg-no-repeat blur-[3px]"
          style={{
            backgroundImage:
              "url('/safespace-background.png')",
          }}
        />

        {/* Soft white overlay */}
        <div className="absolute inset-0 bg-white/45" />

        {/* Subtle blue ambient tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-blue-100/20" />
      </div>

      {/* Page content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}