import type React from "react"
import type { Metadata } from "next"
import { Orbitron, Share_Tech_Mono } from "next/font/google"
// Added pixel fonts for retro styling
import { Press_Start_2P, VT323, Silkscreen } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
// Import ant-design CSS first, then custom CSS to override
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css"
import "./globals.css"
import { Suspense } from "react"
import { SocketProvider } from "@/contexts/SocketContext"
import { Providers } from "@/components/common/providers"

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
})

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-share-tech-mono",
  display: "swap",
})

// Pixel fonts for retro styling
const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start-2p',
  display: 'swap',
})

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
  display: 'swap',
})

const silkscreen = Silkscreen({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-silkscreen',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "ASUR - Space Mafia Game",
  description: "A pixelated, space-themed onchain mafia/bluff game",
  generator: "v0.app",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  icons: {
    icon: "/images/PepasurLogo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${orbitron.variable} ${shareTechMono.variable} ${pressStart2P.variable} ${vt323.variable} ${silkscreen.variable} antialiased gaming-bg min-h-screen ${vt323.className} overflow-x-hidden`}>
        <Providers>
          <SocketProvider>
            <Suspense>
              {children}
              <Analytics />
            </Suspense>
          </SocketProvider>
        </Providers>
      </body>
    </html>
  )
}