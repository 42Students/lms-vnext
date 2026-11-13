import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {z} from "zod";
import {
  createPlacementCompany,
  listPlacementCompanies,
} from "@/modules/placements/company-service";

import { privateJson } from "@/security/responses";
export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const collegeId = new URL(request.url).searchParams.get("collegeId");
    if(!z.string().uuid().safeParse(collegeId).success)
      return NextResponse.json({error:"INVALID_COLLEGE_ID",message:"Select a valid college."},{status:400});
    const companies = await listPlacementCompanies(
      context,
      collegeId ?? "",
    );
    return privateJson({ companies, message:"Companies fetched" });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const body = await boundedRequestJson(request);
    const result = await createPlacementCompany(
      context,
      body,
    );
    return NextResponse.json({...result,message:"Company created"}, { status: 201 });
  },
);
