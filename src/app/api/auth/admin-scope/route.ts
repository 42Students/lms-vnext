import {privateAuthJson,privateAuthResponse} from "@/modules/auth/private-response";
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
      body = await request.json();
    } catch {
      return privateAuthJson(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

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
