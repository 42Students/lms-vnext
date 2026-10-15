import { redirect } from "next/navigation";

/** Preserve an existing workspace subsection while enforcing canonical page guards. */
export default async function LegacyCollegeWorkspaceSectionRedirect({
  params,
}: {
  params: Promise<{ workspaceId: string; section: string }>;
}) {
  const { workspaceId, section } = await params;
  redirect(
    "/college/projects/" + encodeURIComponent(workspaceId) +
    "/" + encodeURIComponent(section),
  );
}
