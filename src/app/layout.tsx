import type { Metadata } from "next";
import "./globals.css";
import { OfflineBanner } from "@/components/public/offline-banner";
import { BrowserSupportNotice } from "@/components/public/browser-support-notice";

export const metadata: Metadata = {
  title: { default: "42LMS", template: "%s · 42LMS" },
  description: "42LMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><noscript>Please enable JavaScript to use the LMS.</noscript><BrowserSupportNotice /><OfflineBanner />{children}</body>
    </html>
  );
}
