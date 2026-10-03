import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";

export default async function LearnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await getCurrentRequestContext();

  if (!hasMembershipRole(context, "LEARNER")) {
    redirect("/dashboard");
  }

  return children;
}
