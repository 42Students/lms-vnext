import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { canAccessRolePortal } from "@/modules/identity/role-portal-policy";
import { deniedPortalHome } from "@/modules/identity/unauthorized-portal-home";

/** Legacy /superadmin bookmarks are a protected alias of /admin.
 * Guard the whole subtree before a redirect, page lookup, or project query.
 */
export default async function SuperAdminAliasLayout({
  children,
}: Readonly<{children: React.ReactNode}>) {
  const context = await getCurrentRequestContext();
  if (!canAccessRolePortal(context, "superadmin")) {
    redirect(deniedPortalHome(context));
  }
  return children;
}
