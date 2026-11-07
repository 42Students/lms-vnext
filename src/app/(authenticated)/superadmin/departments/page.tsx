import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { legacyAdminBookmarkHref, legacyDepartmentDestination } from "@/modules/admin-ui/legacy-department-links";

/** Keep legacy Super Admin bookmarks behind the current global-role fence. */
export default async function LegacySuperAdminDepartments({searchParams}: {
  searchParams?: Promise<Record<string,string|string[]|undefined>>;
} = {}) {
  const context = await getCurrentRequestContext();
  redirect(legacyAdminBookmarkHref(legacyDepartmentDestination(context, "SUPER_ADMIN"),
    (await searchParams) ?? {}));
}
