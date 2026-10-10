import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { legacyDepartmentDestination } from "@/modules/admin-ui/legacy-department-links";

/** Preserve legacy College Admin bookmarks without duplicating the editor. */
export default async function LegacyCollegeAdminDepartments() {
  const context = await getCurrentRequestContext();
  redirect(legacyDepartmentDestination(context, "COLLEGE_ADMIN"));
}
