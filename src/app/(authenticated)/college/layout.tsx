import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";

export default async function CollegeAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await getCurrentRequestContext();

  if (!hasMembershipRole(context, "COLLEGE_ADMIN")) {
    redirect("/dashboard");
  }

  return children;
}
