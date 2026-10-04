import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasActiveRecruiter } from "@/modules/identity/context";

export default async function HrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context =
    await getCurrentRequestContext();

  if (!hasActiveRecruiter(context)) {
    redirect("/dashboard");
  }

  return children;
}
