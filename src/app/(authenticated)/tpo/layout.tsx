import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";

export default async function TpoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context =
    await getCurrentRequestContext();

  if (
    !hasMembershipRole(
      context,
      "TPO",
    )
  ) {
    redirect("/dashboard");
  }

  return children;
}
