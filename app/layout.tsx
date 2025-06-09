import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { initializeStorage, startAutoSync } from "@/lib/dataStore";
import BackgroundVideo from "@/components/background-video";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meatify - Professional BBQ Temperature Monitoring",
  description: "Real-time temperature monitoring for BBQ enthusiasts and professional pitmasters. Multi-device sync, Node-RED integration, and weather-aware cooking.",
  keywords: "BBQ, temperature monitoring, grill, meat, sensors, Node-RED, Raspberry Pi",
  authors: [{ name: "Meatify Team" }],
  creator: "Meatify",
  publisher: "Meatify",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#F59E0B",
  openGraph: {
    title: "Meatify - Professional BBQ Temperature Monitoring",
    description: "Real-time temperature monitoring for BBQ enthusiasts and professional pitmasters",
    type: "website",
    locale: "en_US",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize storage on server startup
  if (typeof window === "undefined") {
    await initializeStorage();
    // Auto-sync will be started by the client-side components
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative`}
      >
        <BackgroundVideo enableToggle={process.env.NODE_ENV === 'development'} />
        {children}
      </body>
    </html>
  );
}
