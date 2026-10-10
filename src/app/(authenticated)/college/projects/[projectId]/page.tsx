import { redirect } from "next/navigation";

export default async function CollegeProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(
    "/college/projects/" +
      encodeURIComponent(projectId) +
      "/summary",
  );
}
