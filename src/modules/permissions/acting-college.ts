import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges, organizations } from "@/db/schema";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, type PlatformPermission } from "@/modules/permissions/policy";
import { requireActingCollege } from "./acting-college-policy";

/** Fail closed on unselected, inactive or mismatched Super Admin tenants. */
export async function resolveActingCollege(
  context: RequestContext,
  permission: PlatformPermission,
) {
  if (!isSuperAdmin(context)) {
    return requireActingCollege(context, permission);
  }

  const id = context.adminScope?.collegeId;
  if (!id) throw new AuthorizationError(permission);

  const [selected] = await getDb()
    .select({ collegeId: colleges.id, organizationId: colleges.organizationId })
    .from(colleges)
    .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
    .where(and(
      eq(colleges.id, id),
      eq(colleges.status, "ACTIVE"),
      eq(organizations.status, "ACTIVE"),
    ))
    .limit(1);

  return requireActingCollege(context, permission, selected);
}
