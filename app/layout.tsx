// app/layout.tsx - Server Component
import { Geist } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/client-providers";

// Base URL configuration for metadata
const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

// Metadata configuration
export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

// Font configuration
const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistSans.className}`}
      suppressHydrationWarning
    >
      <head />
      <body className="bg-background text-foreground antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}