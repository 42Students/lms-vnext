import { redirect } from "next/navigation";

/** Existing bookmarks must land on the persisted workspace detail route. */
export default async function LegacyCollegeWorkspaceRedirect({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  redirect("/college/projects/" + encodeURIComponent(workspaceId));
}
