import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOriginRequest } from "@/auth/origin";
import {
  MEMBERSHIP_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  SessionAuthenticationError,
} from "@/auth/session";
import {
  getCurrentIdentityUid,
} from "@/auth/request-context";
import {
  ContextResolutionError,
  listMembershipChoices,
  resolveRequestContext,
} from "@/modules/identity/context-service";

export const runtime = "nodejs";

const switchMembershipSchema = z.object({
  membershipId: z.string().uuid(),
});

function authErrorResponse(error: unknown) {
  if (error instanceof SessionAuthenticationError) {
    return NextResponse.json(
      { error: error.code },
      { status: 401 },
    );
  }

  if (error instanceof ContextResolutionError) {
    return NextResponse.json(
      { error: error.code },
      {
        status:
          error.code === "MEMBERSHIP_NOT_FOUND"
            ? 403
            : 401,
      },
    );
  }

  return NextResponse.json(
    { error: "INTERNAL_ERROR" },
    { status: 500 },
  );
}

export async function GET() {
  try {
    const identityUid = await getCurrentIdentityUid();
    const memberships = await listMembershipChoices(identityUid);

    return NextResponse.json({ memberships });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const identityUid = await getCurrentIdentityUid();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const parsed = switchMembershipSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const context = await resolveRequestContext({
      identityUid,
      activeMembershipId: parsed.data.membershipId,
    });

    if (context.membership?.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "MEMBERSHIP_NOT_ACTIVE" },
        { status: 403 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      membership: context.membership,
    });

    response.cookies.set(
      MEMBERSHIP_COOKIE_NAME,
      context.membership.id,
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
    return authErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(MEMBERSHIP_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
