import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { canAccessRolePortal } from "@/modules/identity/role-portal-policy";

export default async function LearnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await getCurrentRequestContext();

  if (!canAccessRolePortal(context, "learn")) {
    redirect("/dashboard");
  }

  return children;
}
