import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { AdminOtpLockoutResetForm } from "@/components/auth/admin-otp-lockout-reset-form";

export default async function AdminOtpRecoveryPage() {
  if (!isSuperAdmin(await getCurrentRequestContext())) redirect("/dashboard");
  return <main className="rounded-xl border border-[var(--lms-canvas-border)] bg-white p-6">
    <PageHeader title="Clear OTP lockout" description="Staff-assisted sign-in recovery" />
    <AdminOtpLockoutResetForm />
  </main>;
}
