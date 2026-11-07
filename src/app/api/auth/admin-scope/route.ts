import { route } from "@/security/route";
import {AdminScopeServiceError} from "@/modules/admin-scope/service";
import {ZodError} from "zod";
import {getDb} from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {privateAuthJson,privateAuthResponse} from "@/modules/auth/private-response";
import {readBoundedAuthJson,AuthRequestBodyTooLarge} from "@/modules/auth/bounded-json";
import {
  ADMIN_SCOPE_COOKIE_NAME,
  ADMIN_SCOPE_EXPIRY_COOKIE_NAME,
  ADMIN_SCOPE_MAX_AGE_SECONDS,
  encodeAdminScopeCookie,
} from "@/auth/admin-scope";
import { writeStructuredLog } from "@/observability/logger";
import { isSameOriginRequest } from "@/auth/origin";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  listAdminScopeChoices,
  resolveAdminScopeSelection,
} from "@/modules/admin-scope/service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const context = __actor!;
    try {
const choices = await listAdminScopeChoices(context);
await getDb().transaction(tx=>assertPersistedPlatformPermission(tx,context,"admin-scope.select"));
return privateAuthJson({
      scope:context.adminScope??null,choices,
      // Legacy /auth/memberships is now /api/auth/memberships; changing
      // college x role uses the membership chooser, not platform admin scope.
      navigation:{memberships:"/api/auth/memberships",
       adminScope:"/api/auth/admin-scope",clearMethod:"DELETE"},
      restoredFrom:"VERIFIED_SERVER_SCOPE",
    });
} catch (error) {
    return privateAuthResponse(apiErrorResponse(error));
  }
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
let body: unknown;
try {
      body = await readBoundedAuthJson(request,2_048);
    } catch(error) {
      const tooLarge=error instanceof AuthRequestBodyTooLarge;
      return privateAuthJson(
        { error: tooLarge?"REQUEST_TOO_LARGE":"INVALID_REQUEST" },
        { status: tooLarge?413:400 },
      );
    }
await getDb().transaction(tx=>assertPersistedPlatformPermission(tx,context,"admin-scope.select"));
const scope = await resolveAdminScopeSelection(
      context,
      body,
    );
const cleared=!scope.organizationId&&!scope.collegeId;
const response = privateAuthJson({
      ok:true,scope:cleared?null:scope,
      // Scope cookies are not login identities; authorization is checked
      // against current persisted permissions for every following request.
      requiresRouterRefresh:true,
      activeScope:cleared?"GLOBAL":scope.collegeId?"COLLEGE":"ORGANIZATION",
    });
response.cookies.set(
      ADMIN_SCOPE_COOKIE_NAME,
      encodeAdminScopeCookie(scope),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: cleared?0:ADMIN_SCOPE_MAX_AGE_SECONDS,
      },
    );
response.cookies.set(
      ADMIN_SCOPE_EXPIRY_COOKIE_NAME,
      cleared?"":String(Math.floor(Date.now()/1000)+ADMIN_SCOPE_MAX_AGE_SECONDS),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: cleared?0:ADMIN_SCOPE_MAX_AGE_SECONDS,
      },
    );
writeStructuredLog("INFO","admin_scope.audit",{
      outcome:cleared?"cleared":"entered",
      userId:context.user.id,
      organizationId:scope.organizationId??null,
      collegeId:scope.collegeId??null,
      ttlSeconds:cleared?0:ADMIN_SCOPE_MAX_AGE_SECONDS,
    });
return response;
} catch (error) {
    if(error instanceof AdminScopeServiceError)return privateAuthJson({
      error:"ADMIN_SCOPE_NOT_FOUND",message:"Could not select that scope. It may no longer be available; reload the organization and college choices. Your previous scope was not changed.",
      status:400,type:"validation",
    },{status:400});
    if(error instanceof ZodError)return privateAuthJson({
      error:"INVALID_REQUEST",message:"Invalid collegeId or organizationId. Select a valid scope.",
      status:400,type:"validation",fieldErrors:error.issues.map(issue=>({field:issue.path.join("."),message:issue.message})),
    },{status:400});
    return privateAuthResponse(apiErrorResponse(error));
  }
  },
);

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const context = __actor!;
    try {
await listAdminScopeChoices(context);
await getDb().transaction(tx=>assertPersistedPlatformPermission(tx,context,"admin-scope.select"));
const response = privateAuthJson({
      ok:true,scope:null,activeScope:"GLOBAL",requiresRouterRefresh:true,
      message:"Super Admin organization and college scope cleared.",
    });
response.cookies.set(ADMIN_SCOPE_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
response.cookies.set(ADMIN_SCOPE_EXPIRY_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
writeStructuredLog("INFO","admin_scope.audit",{ outcome:"cleared", userId:context.user.id });
return response;
} catch (error) {
    return privateAuthResponse(apiErrorResponse(error));
  }
  },
);
