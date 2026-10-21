import {AdminScopeServiceError} from "@/modules/admin-scope/service";
import {ZodError} from "zod";
import {getDb} from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {privateAuthJson,privateAuthResponse} from "@/modules/auth/private-response";
import {readBoundedAuthJson,AuthRequestBodyTooLarge} from "@/modules/auth/bounded-json";
import {
  ADMIN_SCOPE_COOKIE_NAME,
  encodeAdminScopeCookie,
} from "@/auth/admin-scope";
import { isSameOriginRequest } from "@/auth/origin";
import { getCurrentRequestContext } from "@/auth/request-context";
import { SESSION_MAX_AGE_SECONDS } from "@/auth/session";
import { apiErrorResponse } from "@/lib/api-error";
import {
  listAdminScopeChoices,
  resolveAdminScopeSelection,
} from "@/modules/admin-scope/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context = await getCurrentRequestContext();
    const choices = await listAdminScopeChoices(context);
    await getDb().transaction(tx=>assertPersistedPlatformPermission(tx,context,"admin-scope.select"));

    return privateAuthJson({
      scope: context.adminScope ?? null,
      choices,
    });
  } catch (error) {
    return privateAuthResponse(apiErrorResponse(error));
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return privateAuthJson(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();

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
    const response = privateAuthJson({
      ok: true,
      scope,
    });

    response.cookies.set(
      ADMIN_SCOPE_COOKIE_NAME,
      encodeAdminScopeCookie(scope),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
      },
    );

    return response;
  } catch (error) {
    if(error instanceof AdminScopeServiceError)return privateAuthJson({
      error:"ADMIN_SCOPE_NOT_FOUND",message:"Invalid collegeId or organization selection. Choose an active college in the selected organization.",
      status:400,type:"validation",
    },{status:400});
    if(error instanceof ZodError)return privateAuthJson({
      error:"INVALID_REQUEST",message:"Invalid collegeId or organizationId. Select a valid scope.",
      status:400,type:"validation",fieldErrors:error.issues.map(issue=>({field:issue.path.join("."),message:issue.message})),
    },{status:400});
    return privateAuthResponse(apiErrorResponse(error));
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return privateAuthJson(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    await listAdminScopeChoices(context);
    await getDb().transaction(tx=>assertPersistedPlatformPermission(tx,context,"admin-scope.select"));

    const response = privateAuthJson({
      ok: true,
      scope: null,
    });

    response.cookies.set(ADMIN_SCOPE_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return privateAuthResponse(apiErrorResponse(error));
  }
}
