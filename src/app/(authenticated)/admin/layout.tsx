import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {SuperAdminLegacyGroupTabs} from "@/components/admin/super-admin-legacy-group-tabs";

export default async function SuperAdminLayout({
  children,
}:Readonly<{children:React.ReactNode}>){
  const context=await getCurrentRequestContext();
  // Deny the console but retain the user's existing session/workspace.
  // Old LMS showed a Superadmin access-denied message without signing out.
  if(!isSuperAdmin(context))return <div className="min-w-0 space-y-4">
    <PageHeader title="Access denied"/>
    <ErrorState title="Access denied. You are not authorized to access Superadmin."
      description="Your current account session is unchanged."
      action={<Link href="/dashboard"
        className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
        Return to dashboard
      </Link>}/>
  </div>;
  return <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)] print:space-y-0">
    <SuperAdminLegacyGroupTabs />
    <div className="min-w-0">{children}</div>
  </div>;
}
