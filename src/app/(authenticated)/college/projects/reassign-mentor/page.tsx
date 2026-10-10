import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectAdminReassignMentorPage } from "@/components/projects/project-admin-reassign-mentor-page";

export default async function CollegeProjectReassignMentorRoute({
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
    <ProjectAdminReassignMentorPage
      collegeId={context.membership.collegeId}
      basePath="/college/projects"
      eyebrow="College Admin Projects"
      searchParams={await searchParams}
    />
  );
}
