import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {SuperAdminLegacyGroupTabs} from "@/components/admin/super-admin-legacy-group-tabs";

export default async function SuperAdminLayout({
  children,
}:Readonly<{children:React.ReactNode}>){
  const context=await getCurrentRequestContext();
  if(!isSuperAdmin(context))redirect("/dashboard");
  return <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)] print:space-y-0">
    <SuperAdminLegacyGroupTabs />
    <div className="min-w-0">{children}</div>
  </div>;
}
