import Sidebar from '@/components/dashboard/Sidebar'
import MobileNavigation from '@/components/dashboard/MobileNavigation'
import AmbientBackground from '@/components/branding/AmbientBackground'

export default function DashboardLayout({
  children,
}) {
  return (
    <AmbientBackground>
      <div className="min-h-screen">

        {/* Desktop */}
        <Sidebar />

        {/* Mobile */}
        <MobileNavigation />

        {/* Main content */}
        <main className="min-w-0 pb-20 lg:pl-72 lg:pb-0">
          <div className="pt-16 lg:pt-0">
            {children}
          </div>
        </main>

      </div>
    </AmbientBackground>
  )
}