import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { canAccessFacultyRoute } from "@/modules/courses/faculty-route-access-model";

export default async function FacultyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await getCurrentRequestContext();
  if (!canAccessFacultyRoute(context)) {
    redirect("/dashboard");
  }
  return children;
}
