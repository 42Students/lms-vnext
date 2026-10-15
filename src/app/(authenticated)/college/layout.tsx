import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { CollegeLegacyGroupTabs } from "@/components/college/college-legacy-group-tabs";

export default async function CollegeAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await getCurrentRequestContext();

  if (!hasMembershipRole(context, "COLLEGE_ADMIN")) {
    redirect("/dashboard");
  }

  return <>
    <CollegeLegacyGroupTabs />
    {children}
  </>;
}
