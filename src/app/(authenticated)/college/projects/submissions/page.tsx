import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectAdminSubmissionsPage } from "@/components/projects/project-admin-submissions-page";

export default async function CollegeProjectSubmissionsRoute({
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
    <ProjectAdminSubmissionsPage
      collegeId={context.membership.collegeId}
      basePath="/college/projects"
      eyebrow="College Admin Projects"
      searchParams={await searchParams}
    />
  );
}
