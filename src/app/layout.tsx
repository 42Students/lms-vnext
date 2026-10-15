import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
