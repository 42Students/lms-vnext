import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { legacyProgramDestination } from "@/modules/admin-ui/legacy-department-links";

export default async function LegacyCollegeAdminPrograms() {
  const context = await getCurrentRequestContext();
  redirect(legacyProgramDestination(context, "COLLEGE_ADMIN"));
}
