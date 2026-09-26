import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/safespace-background.png')",
        }}
      />

      {/* Light overlay */}
      <div className="absolute inset-0 bg-white/20" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen">
        {/* Navigation */}
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur-md"
          >
            <img
              src="/school-logo.png"
              alt="CCTC"
              className="h-10 w-10 object-contain"
            />

            <div>
              <p className="text-sm font-bold text-slate-900">
                CCTC SafeSpace
              </p>

              <p className="text-xs text-slate-500">
                Student Safety & Support
              </p>
            </div>
          </Link>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2 rounded-2xl bg-white/90 p-1.5 shadow-sm backdrop-blur-md">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* Main section */}
        <section className="mx-auto flex min-h-[calc(100vh-90px)] max-w-7xl items-center px-6 py-12">
          <div className="grid w-full items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">

            {/* Hero Card */}
            <div className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-xl backdrop-blur-md sm:p-10 lg:p-12">

              {/* Label */}
              <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-2 text-xs font-medium text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                Student Safety & Support
              </div>

              {/* Heading */}
              <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                A safer space to
                <span className="block text-blue-600">
                  speak up and seek support.
                </span>
              </h1>

              {/* Description */}
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                CCTC SafeSpace gives students a secure place to report
                concerns, request assistance, and connect with authorized
                school personnel.
              </p>

              {/* Action buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="rounded-xl bg-blue-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Report a Concern
                </Link>

                <Link
                  href="/register"
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Create an Account
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-200 pt-6 text-xs text-slate-500">

                <span className="flex items-center gap-2">
                  <span>🔒</span>
                  Secure reporting
                </span>

                <span className="flex items-center gap-2">
                  <span>🤝</span>
                  Trusted support
                </span>

                <span className="flex items-center gap-2">
                  <span>🛡️</span>
                  Student focused
                </span>

              </div>
            </div>

            {/* Feature Cards */}
            <div className="space-y-4">

              <FeatureCard
                icon="🔒"
                title="Secure Reporting"
                description="Submit concerns through a protected system designed for student safety."
              />

              <FeatureCard
                icon="🤖"
                title="AI-Assisted Analysis"
                description="Reports can be analyzed and organized to help authorized staff review concerns."
              />

              <FeatureCard
                icon="💬"
                title="Support & Communication"
                description="Connect with authorized teachers and counselors when you need assistance."
              />

              <FeatureCard
                icon="📋"
                title="Report Tracking"
                description="Keep track of submitted concerns and view updates on their status."
              />

            </div>
          </div>
        </section>
      </div>
    </main>
  )
}


/* Feature Card */
function FeatureCard({ icon, title, description }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-lg backdrop-blur-md transition hover:bg-white">
      <div className="flex items-start gap-4">

        {/* Icon */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg">
          {icon}
        </div>

        {/* Text */}
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            {title}
          </h2>

          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>

      </div>
    </div>
  )
}