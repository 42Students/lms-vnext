import "server-only";
import {eq,and} from "drizzle-orm";
import {getDb} from "@/db/client";
import {users} from "@/db/schema";
import {requirePermission,AuthorizationError} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
import {requireLearnerPlacementAccess} from "./learner-participation-guard";
export async function getOwnLearnerPlacementGreeting(context:RequestContext):Promise<string|null>{
 const membership=await requireLearnerPlacementAccess(context);
 requirePermission(context,"placements.read",{collegeId:membership.collegeId,organizationId:membership.organizationId});
 const [row]=await getDb().select({displayName:users.displayName}).from(users)
  .where(and(eq(users.id,context.user.id),eq(users.platformStatus,"ACTIVE"))).limit(1);
 if(!row)throw new AuthorizationError("placements.read");
 return row.displayName?.trim()||null;
}
