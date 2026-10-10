import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectAdminAtRiskPage } from "@/components/projects/project-admin-at-risk-page";

export default async function CollegeProjectAtRiskRoute({
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
    <ProjectAdminAtRiskPage
      collegeId={context.membership.collegeId}
      basePath="/college/projects"
      eyebrow="College Admin Projects"
      searchParams={await searchParams}
    />
  );
}
