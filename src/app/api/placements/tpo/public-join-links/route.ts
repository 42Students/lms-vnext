import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  changeTpoPublicJoinLink, TpoPublicJoinLinkError,
} from "@/modules/placements/tpo-public-join-link-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const result = await changeTpoPublicJoinLink(await getCurrentRequestContext(), body);
    return NextResponse.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
    }
    if (error instanceof TpoPublicJoinLinkError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code === "NOT_REGISTERED" ? 503 :
          error.code === "DOMAIN_REQUIRED" ? 422 :
          error.code === "NOT_FOUND" ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
}
