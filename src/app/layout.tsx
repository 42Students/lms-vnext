import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { OfflineBanner } from "@/components/public/offline-banner";
import { BrowserSupportNotice } from "@/components/public/browser-support-notice";

// Premium UI font, as in the old LMS (Inter 400/500/600/700 + JetBrains Mono). Self-hosted by next/font at build time.
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], display: "swap", variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: { default: "42 LMS", template: "%s · 42 LMS" },
  description: "42 LMS — learning, applied projects and placement operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body><noscript>Please enable JavaScript to use the LMS.</noscript><BrowserSupportNotice /><OfflineBanner />{children}</body>
    </html>
  );
}
