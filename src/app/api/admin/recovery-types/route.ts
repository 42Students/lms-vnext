import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requirePermission} from "@/modules/permissions/policy";
import {RECOVERY_ENTITY_TYPES} from "@/modules/admin-ui/recovery-type-registry";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "admin-scope.select" },
  async ({ context: actor }) => {
    const context = actor!;
    requirePermission(context,"admin-scope.select");
    const mayRestore=context.adminScope?.organizationId||context.adminScope?.collegeId;
    return NextResponse.json({types:RECOVERY_ENTITY_TYPES.map(type=>({
   ...type,available:type.implemented&&(!mayRestore||type.platformLevel),
  }))},{headers:{"Cache-Control":"private, no-store"}});
  },
);
