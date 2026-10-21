import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  assignProjectTemplateToCollege,
  revokeProjectTemplateFromCollege,
  replaceProjectTemplateCollegeAssignments,
  getProjectTemplateDetail,
} from "@/modules/projects/template-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ templateId: string }>;
};

const bodySchema = z
  .object({
    collegeId: z.string().uuid(),
  })
  .strict();

async function parseRequest(
  request: Request,
) {
  return bodySchema.parse(await request.json());
}

const replaceSchema=z.strictObject({
  collegeIds:z.array(z.string().uuid()).max(100).refine(ids=>new Set(ids).size===ids.length,
    "Select each college only once"),
  expectedCollegeIds:z.array(z.string().uuid()).max(100).refine(ids=>new Set(ids).size===ids.length,
    "The expected college list contains duplicates"),
});

/** Preview the authoritative scoped current assignment set for optimistic edits. */
export async function GET(_request:Request,{params}:RouteContext){
 try{
  const context=await getCurrentRequestContext();
  const {templateId}=await params;
  const detail=await getProjectTemplateDetail(context,templateId);
  return NextResponse.json({collegeIds:detail.assignments.map(item=>item.collegeId).sort()});
 }catch(error){return apiErrorResponse(error);}
}

/** Atomic set replacement, with a compare-and-swap expected set. */
export async function PUT(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {templateId}=await params;
  const body=replaceSchema.parse(await request.json());
  const outcome=await replaceProjectTemplateCollegeAssignments(context,templateId,
   body.collegeIds,body.expectedCollegeIds);
  return NextResponse.json({outcome,message:outcome.added.length||outcome.removed.length?
   "Template assignments updated":"Template assignments unchanged"});
 }catch(error){return apiErrorResponse(error);}
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { templateId } = await params;
    const body = await parseRequest(request);
    const assignment =
      await assignProjectTemplateToCollege(
        context,
        templateId,
        body.collegeId,
      );

    return NextResponse.json(
      { assignment },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { templateId } = await params;
    const body = await parseRequest(request);
    const assignment =
      await revokeProjectTemplateFromCollege(
        context,
        templateId,
        body.collegeId,
      );

    return NextResponse.json({ assignment });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
