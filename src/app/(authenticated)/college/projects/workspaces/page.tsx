import { redirect } from "next/navigation";
import { legacyCollegeWorkspacesListHref } from "@/modules/projects/legacy-college-workspaces-list-query";

/** Old Workspaces bookmarks keep their supported search, status, view
 * and pagination without redirecting through an invalid-filter screen.
 */
export default async function LegacyCollegeWorkspacesRedirect({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect(legacyCollegeWorkspacesListHref(await searchParams));
}
