import {redirect} from "next/navigation";
import {legacyClassWorkspaceCreateHref} from "@/modules/projects/legacy-class-workspace-create-query";

/** Keep legacy class-workspace bookmarks in team mode and retain a safe
 * template selection. The destination rechecks college/template authorization.
 */
export default async function CollegeClassProjectWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect(legacyClassWorkspaceCreateHref(await searchParams));
}
