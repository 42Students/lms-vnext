import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Privacy | 42LMS" };

/** Preserve the public/mobile privacy URL using the full existing legacy policy. */
export default function PrivacyPolicyPage() {
  redirect("/assets/static/privacy-policy-view.html");
}
