import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {requirePermission} from "@/modules/permissions/policy";
import {ProjectsServiceError} from "@/modules/projects/errors";
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
  requirePermission(context,"project-template.assign");
  if(context.adminScope?.collegeId)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const body=bulkSchema.parse(await request.json());
  const result=await replaceProjectTemplateCollegeAssignments(context,templateId,
    body.collegeIds,body.expectedCollegeIds);
  return NextResponse.json({
    ...result,beforeCollegeIds:[...body.expectedCollegeIds].sort(),
    afterCollegeIds:result.collegeIds,
    total:result.collegeIds.length,
    addedCount:result.added.length,removedCount:result.removed.length,
    message:result.added.length||result.removed.length?
      "Template assignments updated":"Template assignments unchanged",
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}

/** Read the baseline set to send back as expectedCollegeIds on PUT. */
export async function GET(_request:Request,{params}:RouteContext){
 try{
  const {templateId}=await params;
  const context=await getCurrentRequestContext();
  requirePermission(context,"project-template.manage");
  if(context.adminScope?.collegeId||context.adminScope?.organizationId)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const detail=await getProjectTemplateDetail(context,templateId);
  return NextResponse.json({
    collegeIds:detail.assignments.map(item=>item.collegeId).sort(),
    assignments:detail.assignments.map(item=>({
      collegeId:item.collegeId,templateId:detail.template.id,
    })),
    total:detail.assignments.length,
    templateId:detail.template.id,
    editHint:"Use this collegeIds list as expectedCollegeIds on PUT to prevent overwriting another administrator's edits.",
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
