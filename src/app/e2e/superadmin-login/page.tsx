import { redirect } from "next/navigation";

/** Legacy e2e bookmark does not bypass the first-party privileged sign-in. */
export default function LegacySuperAdminE2ELoginPage() {
  redirect("/login");
}
