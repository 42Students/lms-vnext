import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { AdminOtpLockoutResetForm } from "@/components/auth/admin-otp-lockout-reset-form";

export default async function AdminOtpRecoveryPage() {
  if (!isSuperAdmin(await getCurrentRequestContext())) redirect("/dashboard");
  return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Clear OTP lockout" description="Staff-assisted sign-in recovery" />
    <AdminOtpLockoutResetForm />
  </div>;
}
