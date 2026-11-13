import "server-only";
import { redirect } from "next/navigation";
import "@/styles/college-admin-north-star.css";
import { getCurrentRequestContext } from "@/auth/request-context";
import { canAccessRolePortal } from "@/modules/identity/role-portal-policy";
import { deniedPortalHome } from "@/modules/identity/unauthorized-portal-home";

/** Legacy /college-admin aliases must enforce the same role boundary as
 * canonical /college before nested dynamic bookmarks query tenant resources.
 */
export default async function CollegeAdminAliasLayout({
  children,
}: Readonly<{children: React.ReactNode}>) {
  const context=await getCurrentRequestContext();
  if(!canAccessRolePortal(context,"college-admin")) {
    redirect(deniedPortalHome(context));
  }
  return <div className="lms-college-portal">{children}</div>;
}
