import type { Metadata } from "next";
import "./globals.css";

import { Inter } from "next/font/google"
const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const geistMono = {
  variable: "--font-geist-mono",
};

export const metadata: Metadata = {
  title: "Sadhusanga",
  description: "Band rehearsal and setlist management app.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sadhusanga",
    startupImage: "/apple-touch-icon.png",
  },
  icons: {
    icon: [
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InstallPrompt } from "@/components/install-prompt";
import { MobileNav } from "@/components/mobile-nav";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontInter.variable} ${geistMono.variable} antialiased text-[1.05rem] font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* Fixed background wallpaper with ambient darkness */}
          <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden select-none">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: "url('/app-bg.jpg')" }}
            />
            <div className="absolute inset-0 bg-[#090a0f]/60 backdrop-brightness-75" />
          </div>

          <TooltipProvider>
            <InstallPrompt />
            {children}
            <MobileNav session={session} />
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
