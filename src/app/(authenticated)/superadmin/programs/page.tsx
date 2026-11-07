import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { legacyAdminBookmarkHref, legacyProgramDestination } from "@/modules/admin-ui/legacy-department-links";

export default async function LegacySuperAdminPrograms({searchParams}: {
  searchParams?: Promise<Record<string,string|string[]|undefined>>;
} = {}) {
  const context = await getCurrentRequestContext();
  redirect(legacyAdminBookmarkHref(legacyProgramDestination(context, "SUPER_ADMIN"),
    (await searchParams) ?? {}));
}
