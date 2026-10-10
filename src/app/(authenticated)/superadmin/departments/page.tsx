import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { legacyDepartmentDestination } from "@/modules/admin-ui/legacy-department-links";

/** Keep legacy Super Admin bookmarks behind the current global-role fence. */
export default async function LegacySuperAdminDepartments() {
  const context = await getCurrentRequestContext();
  redirect(legacyDepartmentDestination(context, "SUPER_ADMIN"));
}
