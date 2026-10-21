import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { AdminOtpLockoutResetForm } from "@/components/auth/admin-otp-lockout-reset-form";

export default async function CollegeOtpRecoveryPage() {
  if (!hasMembershipRole(await getCurrentRequestContext(), "COLLEGE_ADMIN"))
    redirect("/dashboard");
  return <main className="rounded-xl border border-[var(--lms-canvas-border)] bg-white p-6">
    <PageHeader title="Clear OTP lockout" description="Support for this college only" />
    <AdminOtpLockoutResetForm />
  </main>;
}
