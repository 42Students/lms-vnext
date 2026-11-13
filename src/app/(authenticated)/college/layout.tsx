import { redirect } from "next/navigation";
import "@/styles/college-admin-north-star.css";
import { getCurrentRequestContext } from "@/auth/request-context";
import { canAccessRolePortal } from "@/modules/identity/role-portal-policy";
import { CollegeLegacyGroupTabs } from "@/components/college/college-legacy-group-tabs";

export default async function CollegeAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await getCurrentRequestContext();

  if (!canAccessRolePortal(context, "college")) {
    redirect("/dashboard");
  }

  return <div className="lms-college-portal">
    <CollegeLegacyGroupTabs />
    {children}
  </div>;
}
