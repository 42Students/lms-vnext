import { NextResponse } from "next/server";
import {z} from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createPlacementCompany,
  listPlacementCompanies,
} from "@/modules/placements/company-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const collegeId = new URL(request.url).searchParams.get("collegeId");
    if(!z.string().uuid().safeParse(collegeId).success)
      return NextResponse.json({error:"INVALID_COLLEGE_ID",message:"Select a valid college."},{status:400});
    const companies = await listPlacementCompanies(
      context,
      collegeId ?? "",
    );
    return NextResponse.json({ companies, message:"Companies fetched" },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
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
    const context = await getCurrentRequestContext();
    const body = await request.json();
    const result = await createPlacementCompany(
      context,
      body,
    );
    return NextResponse.json({...result,message:"Company created"}, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
