'use client'

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  onClick,
  className = '',
}) {
  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700',

    secondary:
      'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',

    danger:
      'bg-red-600 text-white hover:bg-red-700',

    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}