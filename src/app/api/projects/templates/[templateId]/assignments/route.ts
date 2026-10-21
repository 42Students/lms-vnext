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

const bulkSchema=z.strictObject({
 collegeIds:z.array(z.string().uuid()).max(500),
 expectedCollegeIds:z.array(z.string().uuid()).max(500),
}).superRefine((value,ctx)=>{
 if(new Set(value.collegeIds).size!==value.collegeIds.length||
    new Set(value.expectedCollegeIds).size!==value.expectedCollegeIds.length){
  ctx.addIssue({code:"custom",message:"College IDs must be unique"});
 }
});
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

/** Compare and replace all currently assigned colleges, never append blindly. */
export async function PUT(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {templateId}=await params;
  const context=await getCurrentRequestContext();
  const body=bulkSchema.parse(await request.json());
  const result=await replaceProjectTemplateCollegeAssignments(context,templateId,body);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}

/** Read the baseline set to send back as expectedCollegeIds on PUT. */
export async function GET(_request:Request,{params}:RouteContext){
 try{
  const {templateId}=await params;
  const detail=await getProjectTemplateDetail(await getCurrentRequestContext(),templateId);
  return NextResponse.json({
    collegeIds:detail.assignments.map(item=>item.collegeId).sort(),
    templateId:detail.template.id,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
