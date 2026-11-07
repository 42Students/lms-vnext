import type { Metadata } from "next";
import { redirect } from "next/navigation";

/** Deprecated public entry: never grants a privileged session or role. */
export const metadata: Metadata = {
  title: "Secure sign-in | 42 LMS",
  robots: { index: false, follow: false },
};

export default function LegacySuperAdminLoginPage() {
  // Keep old bookmarks working, but use the same first-party OTP entry and
  // server-enforced role checks as every other account.
  redirect("/login?legacy=superadmin");
}
