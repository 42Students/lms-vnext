import { redirect } from "next/navigation";

/** Preserve the public/mobile privacy URL using the full existing legacy policy. */
export default function PrivacyPolicyPage() {
  redirect("/assets/static/privacy-policy-view.html");
}
