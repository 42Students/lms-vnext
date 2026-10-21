import { NextResponse } from "next/server";
import {z} from "zod";
import {projectTemplateBlueprintSchema} from "@/modules/projects/validation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  archiveProjectTemplate,
  getProjectTemplateDetail,
  reviseProjectTemplate,
} from "@/modules/projects/template-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ templateId: string }>;
};

/** Old template read links may include a selected-college hint. The modern
 * UUID and live permission scope remain authoritative; a URL parameter can
 * never expand the caller's selected college.
 */
export async function GET(request:Request,{params}:RouteContext) {
 try{
  const context=await getCurrentRequestContext();
  const query=new URL(request.url).searchParams;
  const values=query.getAll("collegeId");
  if(values.length>1)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  if(values.length===1){
   const requested=values[0];
   if(!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(requested))
    return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
   if(context.adminScope?.collegeId && context.adminScope.collegeId!==requested)
    return NextResponse.json({error:"FORBIDDEN"},{status:403});
   if(context.membership?.collegeId && context.membership.collegeId!==requested)
    return NextResponse.json({error:"FORBIDDEN"},{status:403});
  }
  const detail=await getProjectTemplateDetail(context,(await params).templateId);
  return NextResponse.json({detail,data:detail,status:"OK",message:"Project template retrieved"},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}

export async function PATCH(
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
    const body:unknown = await request.json();
    // Legacy resource-only PUT/PATCH preserves every unrelated blueprint
    // section from the current immutable version. The version CAS in the
    // writer rejects concurrent edits instead of overwriting them.
    if(body && typeof body==="object" && !Array.isArray(body) &&
      "resources" in body && !("blueprint" in body)){
      const input=z.strictObject({
        expectedVersion:z.number().int().positive(),
        resources:z.array(z.unknown()).max(200),
        changeNote:z.string().trim().min(1).max(1000).optional(),
      }).parse(body);
      const detail=await getProjectTemplateDetail(context,templateId);
      if(!detail.currentVersion ||
         detail.template.currentVersion!==input.expectedVersion)
        return NextResponse.json({error:"PROJECT_TEMPLATE_STALE_VERSION"},{status:409});
      const current=projectTemplateBlueprintSchema.parse(detail.currentVersion.blueprint);
      const blueprint=projectTemplateBlueprintSchema.parse({...current,resources:input.resources});
      const result=await reviseProjectTemplate(context,templateId,{
        expectedVersion:input.expectedVersion,title:detail.template.title,
        summary:detail.template.summary??undefined,
        blueprint,changeNote:input.changeNote??"Updated template resources",
      });
      return NextResponse.json({...result,message:"Project template updated"});
    }
    const result = await reviseProjectTemplate(
      context,
      templateId,
      body,
    );

    return NextResponse.json({...result,message:"Project template updated"});
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/** Version-checked PUT alias. Resource-only legacy updates merge all
 * other sections from the current version; never perform a blind overwrite.
 */
export async function PUT(request:Request,context:RouteContext) {
 return PATCH(request,context);
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
    const template = await archiveProjectTemplate(
      context,
      templateId,
    );

    return NextResponse.json({ template });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
