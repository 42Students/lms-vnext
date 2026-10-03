import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";

export default async function FacultyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context =
    await getCurrentRequestContext();

  if (!hasMembershipRole(context, "FACULTY")) {
    redirect("/dashboard");
  }

  return children;
}
