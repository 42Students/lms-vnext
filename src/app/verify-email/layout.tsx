import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify your email | 42LMS",
  description: "Verify ownership of the email address linked to your 42LMS account.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Do not read the fragment or authentication context during server rendering. */
export default function VerifyEmailLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
