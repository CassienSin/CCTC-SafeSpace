import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: {
    default: 'CCTC SafeSpace',
    template: '%s | CCTC SafeSpace',
  },
  description:
    'CCTC SafeSpace student safety and support platform',
  icons: {
    icon: '/school-logo.png',
    shortcut: '/school-logo.png',
    apple: '/school-logo.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  )
}