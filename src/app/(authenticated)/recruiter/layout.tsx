import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { canAccessRolePortal } from "@/modules/identity/role-portal-policy";
export default async function RecruiterLayout({children}: Readonly<{children:React.ReactNode}>) {
  const context=await getCurrentRequestContext();
  if (!canAccessRolePortal(context, "recruiter")) redirect("/dashboard");
  return children;
}
