import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden text-slate-900">
      {/* =========================================================
          FIXED BACKGROUND
          Same visual style as the Register page
      ========================================================= */}

      <div
        className="fixed inset-0 -z-30 scale-105 bg-cover bg-center bg-no-repeat blur-[3px]"
        style={{
          backgroundImage: "url('/safespace-background.png')",
        }}
      />

      {/* Bright white wash */}
      <div className="fixed inset-0 -z-20 bg-white/55" />

      {/* Very subtle blue tint */}
      <div className="fixed inset-0 -z-10 bg-blue-50/10" />

      {/* =========================================================
          PAGE CONTENT
      ========================================================= */}

      <div className="relative z-10">
        {/* =======================================================
            NAVIGATION
        ======================================================= */}

        <header className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-lg backdrop-blur-md sm:px-5">
            {/* BRAND */}
            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
                <img
                  src="/school-logo.png"
                  alt="CCTC"
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900 sm:text-base">
                  CCTC SafeSpace
                </p>

                <p className="text-[11px] text-slate-500 sm:text-xs">
                  Student Safety & Support
                </p>
              </div>
            </Link>

            {/* DESKTOP NAV */}
            <div className="hidden items-center gap-1 md:flex">
              <a
                href="#features"
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Features
              </a>

              <a
                href="#how-it-works"
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                How It Works
              </a>

              <a
                href="#support"
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Support
              </a>
            </div>

            {/* AUTH BUTTONS */}
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:block"
              >
                Sign In
              </Link>

              <Link
                href="/register"
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </header>

        {/* =======================================================
            HERO
        ======================================================= */}

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="grid items-center gap-6 lg:grid-cols-5">
            {/* HERO CONTENT */}

            <div className="rounded-3xl border border-white/80 bg-white/88 p-7 shadow-xl backdrop-blur-md sm:p-10 lg:col-span-3 lg:p-12">
              {/* BADGE */}

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-600" />

                Student Safety & Support
              </div>

              {/* TITLE */}

              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                A safer space to
                <span className="block text-blue-600">
                  speak up and seek support.
                </span>
              </h1>

              {/* DESCRIPTION */}

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                CCTC SafeSpace gives students a secure place to report
                concerns, request assistance, and connect with authorized
                school personnel.
              </p>

              {/* BUTTONS */}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  Report a Concern
                  <span className="ml-2 text-base">
                    →
                  </span>
                </Link>

                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Create an Account
                </Link>
              </div>

              {/* TRUST POINTS */}

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-200 pt-6">
                <TrustPoint text="Secure reporting" />

                <TrustPoint text="Trusted support" />

                <TrustPoint text="Student focused" />
              </div>
            </div>

            {/* HERO SIDE CARDS */}

            <div className="space-y-4 lg:col-span-2">
              <FeatureCard
                icon="🔒"
                iconStyle="blue"
                title="Secure Reporting"
                description="Submit concerns through a protected system designed for student safety."
              />

              <FeatureCard
                icon="🤖"
                iconStyle="violet"
                title="AI-Assisted Analysis"
                description="Reports can be analyzed and organized to assist authorized staff during review."
              />

              <FeatureCard
                icon="💬"
                iconStyle="emerald"
                title="Support & Communication"
                description="Connect with authorized teachers and counselors when support is needed."
              />

              <FeatureCard
                icon="📋"
                iconStyle="amber"
                title="Report Tracking"
                description="Follow the status of submitted concerns and stay informed about updates."
              />
            </div>
          </div>
        </section>

        {/* =======================================================
            INTRODUCTION
        ======================================================= */}

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/80 bg-white/88 p-7 shadow-lg backdrop-blur-md sm:p-10">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                CCTC SafeSpace
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                A dedicated place for student safety and support.
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                Whether you are experiencing bullying, harassment, threats,
                discrimination, or another concern, SafeSpace provides a
                structured way to bring it to the attention of authorized
                school personnel.
              </p>
            </div>
          </div>
        </section>

        {/* =======================================================
            FEATURES
        ======================================================= */}

        <section
          id="features"
          className="mx-auto max-w-7xl scroll-mt-8 px-4 py-14 sm:px-6 lg:px-8"
        >
          <div className="rounded-3xl border border-white/80 bg-white/88 p-7 shadow-lg backdrop-blur-md sm:p-10">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                Features
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                Built around student support
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-slate-600">
                SafeSpace brings reporting, communication, and follow-up into
                one organized platform.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon="🔒"
                title="Secure Reporting"
                description="Submit concerns through a protected system designed for student safety."
                iconStyle="blue"
              />

              <FeatureCard
                icon="🤖"
                title="AI-Assisted Analysis"
                description="Reports can be analyzed and organized to assist authorized staff during review."
                iconStyle="violet"
              />

              <FeatureCard
                icon="💬"
                title="Support & Communication"
                description="Communicate with authorized teachers and counselors when support is needed."
                iconStyle="emerald"
              />

              <FeatureCard
                icon="📋"
                title="Report Tracking"
                description="Follow the status of submitted concerns and stay informed about updates."
                iconStyle="amber"
              />
            </div>
          </div>
        </section>

        {/* =======================================================
            HOW IT WORKS
        ======================================================= */}

        <section
          id="how-it-works"
          className="mx-auto max-w-7xl scroll-mt-8 px-4 py-6 sm:px-6 lg:px-8"
        >
          <div className="rounded-3xl border border-white/80 bg-white/88 p-7 shadow-lg backdrop-blur-md sm:p-10">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              {/* LEFT */}

              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                  How It Works
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                  Getting support is simple.
                </h2>

                <p className="mt-5 max-w-xl leading-7 text-slate-600">
                  SafeSpace provides a straightforward process so students can
                  raise concerns without having to navigate a complicated
                  system.
                </p>

                <Link
                  href="/login"
                  className="mt-7 inline-flex items-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  Start a Report
                  <span className="ml-2">
                    →
                  </span>
                </Link>
              </div>

              {/* STEPS */}

              <div className="space-y-4">
                <StepCard
                  number="01"
                  title="Submit a concern"
                  description="Provide the details of what happened and any information that may help authorized staff understand the situation."
                />

                <StepCard
                  number="02"
                  title="Review and assessment"
                  description="Authorized personnel can review submitted reports and organize them according to the nature and urgency of the concern."
                />

                <StepCard
                  number="03"
                  title="Receive appropriate support"
                  description="School personnel can communicate with students and take appropriate follow-up actions based on the situation."
                />
              </div>
            </div>
          </div>
        </section>

        {/* =======================================================
            SUPPORT
        ======================================================= */}

        <section
          id="support"
          className="mx-auto max-w-7xl scroll-mt-8 px-4 py-14 sm:px-6 lg:px-8"
        >
          <div className="rounded-3xl border border-slate-800/10 bg-slate-900/95 p-7 shadow-xl backdrop-blur-md sm:p-10">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              {/* LEFT */}

              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-xl">
                  🛡️
                </div>

                <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
                  Your concerns deserve to be heard.
                </h2>

                <p className="mt-5 max-w-xl leading-7 text-slate-300">
                  SafeSpace is designed to help students communicate concerns
                  with authorized members of the school community through a
                  structured and accessible reporting system.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                  >
                    Create an Account
                  </Link>

                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    Sign In
                  </Link>
                </div>
              </div>

              {/* SAFETY CARDS */}

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="space-y-6">
                  <SafetyItem
                    icon="🔐"
                    title="Protected access"
                    description="Account-based access helps keep reports and conversations within the intended system."
                  />

                  <SafetyItem
                    icon="👥"
                    title="Authorized personnel"
                    description="Reports and support features are designed around appropriate school staff access."
                  />

                  <SafetyItem
                    icon="🤝"
                    title="Human review"
                    description="AI-assisted analysis supports organization and review; final decisions remain with authorized people."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =======================================================
            FINAL CTA
        ======================================================= */}

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/80 bg-white/90 p-8 text-center shadow-xl backdrop-blur-md sm:p-12">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              CCTC SafeSpace
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Need support or want to report a concern?
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
              Sign in to your account to submit a report, communicate with
              authorized personnel, and keep track of your concerns.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Sign In
              </Link>

              <Link
                href="/register"
                className="rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Create an Account
              </Link>
            </div>
          </div>
        </section>

        {/* =======================================================
            FOOTER
        ======================================================= */}

        <footer className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/70 bg-white/80 px-5 py-5 shadow-sm backdrop-blur-md sm:flex-row">
            <div className="flex items-center gap-3">
              <img
                src="/school-logo.png"
                alt="CCTC"
                className="h-9 w-9 object-contain"
              />

              <div>
                <p className="text-sm font-bold text-slate-900">
                  CCTC SafeSpace
                </p>

                <p className="text-xs text-slate-500">
                  Student Safety & Support
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              CCTC SafeSpace • Student Safety & Support
            </p>
          </div>
        </footer>
      </div>
    </main>
  )
}

/* ===============================================================
   TRUST POINT
=============================================================== */

function TrustPoint({ text }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-600">
        ✓
      </span>

      {text}
    </div>
  )
}

/* ===============================================================
   FEATURE CARD
=============================================================== */

function FeatureCard({
  icon,
  title,
  description,
  iconStyle,
}) {
  const styles = {
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-lg">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ${
          styles[iconStyle] || styles.blue
        }`}
      >
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  )
}

/* ===============================================================
   STEP CARD
=============================================================== */

function StepCard({
  number,
  title,
  description,
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white shadow-sm">
        {number}
      </div>

      <div>
        <h3 className="font-bold text-slate-900">
          {title}
        </h3>

        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  )
}

/* ===============================================================
   SAFETY ITEM
=============================================================== */

function SafetyItem({
  icon,
  title,
  description,
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg">
        {icon}
      </div>

      <div>
        <h3 className="font-bold text-white">
          {title}
        </h3>

        <p className="mt-1.5 text-sm leading-6 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  )
}