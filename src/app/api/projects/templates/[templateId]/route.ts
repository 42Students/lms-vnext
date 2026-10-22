import { NextResponse } from "next/server";
import {z} from "zod";
import {projectTemplateBlueprintSchema,reviseProjectTemplateInputSchema,type ReviseProjectTemplateInput} from "@/modules/projects/validation";
import {requirePermission} from "@/modules/permissions/policy";
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
   if(requested===undefined)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
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
    // Legacy section-only PUT/PATCH requests omit the template title. Merge
    // only the supplied section onto the immutable current version, retaining
    // metadata and all other sections. The writer enforces expectedVersion
    // under its own transactional CAS and verifies platform permissions again.
    const sectionKeys = ["overview","releases","sprints","tasks","resources",
      "submission","delivery","meetings","activity"] as const;
    if(body && typeof body==="object" && !Array.isArray(body) &&
      !("blueprint" in body) && !("title" in body) &&
      sectionKeys.some(key=>key in body)){
      const input=z.strictObject({
        expectedVersion:z.number().int().positive(),
        changeNote:z.string().trim().min(1).max(1000).optional(),
        overview:z.unknown().optional(),
        releases:z.unknown().optional(),
        sprints:z.unknown().optional(),
        tasks:z.unknown().optional(),
        resources:z.unknown().optional(),
        submission:z.unknown().optional(),
        delivery:z.unknown().optional(),
        meetings:z.unknown().optional(),
        activity:z.unknown().optional(),
      }).refine(value=>sectionKeys.some(key=>value[key]!==undefined),{
        message:"Provide at least one template section",
      }).parse(body);
      const detail=await getProjectTemplateDetail(context,templateId);
      if(!detail.currentVersion ||
         detail.template.currentVersion!==input.expectedVersion)
        return NextResponse.json({error:"PROJECT_TEMPLATE_STALE_VERSION"},{status:409});
      const current=projectTemplateBlueprintSchema.parse(detail.currentVersion.blueprint);
      const patch=Object.fromEntries(sectionKeys
        .filter(key=>input[key]!==undefined)
        .map(key=>[key,input[key]]));
      // Partial Overview patches retain the current fields (for example an
      // unchanged definitionOfDone); arrays represent a whole section.
      const overviewPatch=input.overview!==null &&
        typeof input.overview==="object" && !Array.isArray(input.overview)
        ? {overview:{...current.overview,...input.overview}} : {};
      const blueprint=projectTemplateBlueprintSchema.parse({
        ...current,...patch,...overviewPatch,
      });
      const result=await reviseProjectTemplate(context,templateId,{
        expectedVersion:input.expectedVersion,title:detail.template.title,
        summary:detail.template.summary??undefined,
        blueprint,changeNote:input.changeNote??"Updated template section",
      });
      return NextResponse.json({...result,message:"Project template updated"});
    }
    // Same order as the writer: permission first, then the strict input schema.
    requirePermission(context,"project-template.manage");
    const result = await reviseProjectTemplate(
      context,
      templateId,
      // The strict Zod parser validates the full payload before the service
      // accepts it; keep its inferred shape explicit for the writer boundary.
      reviseProjectTemplateInputSchema.parse(body) as ReviseProjectTemplateInput,
    );

    return NextResponse.json({...result,message:"Project template updated"});
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/** Version-checked PUT alias. Section-only legacy updates merge just the
 * submitted section into the immutable current blueprint; never a blind write.
 */
export async function PUT(request:Request,context:RouteContext) {
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
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
