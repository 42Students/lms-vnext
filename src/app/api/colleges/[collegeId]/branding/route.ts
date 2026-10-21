import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readCollegeBrandingBody,CollegeBrandingBodyError} from "@/modules/colleges/admin-branding-request-body";
import {
  CollegeBrandingNotFoundError,
  CollegeBrandingVersionError,
  getCollegeBranding,
  saveCollegeBranding,
} from "@/modules/colleges/branding-service";
import { z } from "zod";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ collegeId: string }> };

const collegeIdSchema = z.string().uuid();

function notFound() {
  return NextResponse.json({
    error: "COLLEGE_NOT_FOUND",
    message: "Couldn't load branding for this college.",
  }, { status: 404 });
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    const collegeId = collegeIdSchema.parse((await params).collegeId);
    return NextResponse.json({
      branding: await getCollegeBranding(context, collegeId),
    });
  } catch (error) {
    if (error instanceof CollegeBrandingNotFoundError) return notFound();
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  try {
    const context = await getCurrentRequestContext();
    const collegeId = collegeIdSchema.parse((await params).collegeId);

    const body=await readCollegeBrandingBody(request);
    return NextResponse.json({
      branding: await saveCollegeBranding(context, collegeId, body),
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    if (error instanceof CollegeBrandingBodyError)
      return NextResponse.json({error:"INVALID_REQUEST"},{
       status:error.code==="BODY_TOO_LARGE"?413:400,
       headers:{"Cache-Control":"private, no-store"},
      });
    if (error instanceof CollegeBrandingVersionError)
      return NextResponse.json({error:"BRANDING_STALE"},{status:409,
       headers:{"Cache-Control":"private, no-store"}});
    if (error instanceof CollegeBrandingNotFoundError) return notFound();
    return apiErrorResponse(error);
  }
}
