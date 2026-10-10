import { redirect } from "next/navigation";

export default async function SuperAdminProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(
    "/admin/projects/" +
      encodeURIComponent(projectId) +
      "/summary",
  );
}
