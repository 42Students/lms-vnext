import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "42 LMS vNext",
  description: "42Students LMS vNext",
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
