import { NextResponse } from "next/server";
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
    const body = await request.json();
    const result = await reviseProjectTemplate(
      context,
      templateId,
      body,
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/** Version-checked PUT alias. Older clients must supply the current
 * expectedVersion and complete blueprint; never perform a blind overwrite.
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
