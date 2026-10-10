import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { legacyProgramDestination } from "@/modules/admin-ui/legacy-department-links";

export default async function LegacySuperAdminPrograms() {
  const context = await getCurrentRequestContext();
  redirect(legacyProgramDestination(context, "SUPER_ADMIN"));
}
