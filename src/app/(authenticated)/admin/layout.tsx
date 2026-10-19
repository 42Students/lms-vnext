import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {SuperAdminLegacyGroupTabs} from "@/components/admin/super-admin-legacy-group-tabs";

export default async function SuperAdminLayout({
  children,
}:Readonly<{children:React.ReactNode}>){
  const context=await getCurrentRequestContext();
  if(!isSuperAdmin(context))redirect("/dashboard");
  return <>
    <SuperAdminLegacyGroupTabs/>
    {children}
  </>;
}
