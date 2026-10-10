import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectAdminReadinessPage } from "@/components/projects/project-admin-readiness-page";

export default async function CollegeProjectReadinessRoute({
  searchParams,
}: {
  searchParams: Promise<
    Record<
      string,
      string | string[] | undefined
    >
  >;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) {
    redirect("/dashboard");
  }

  return (
    <ProjectAdminReadinessPage
      collegeId={context.membership.collegeId}
      basePath="/college/projects"
      eyebrow="College Admin Projects"
      searchParams={await searchParams}
    />
  );
}
