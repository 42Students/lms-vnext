import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import { z } from "zod";
import {
  createProjectTemplate,
  listAssignedProjectTemplates,
  listProjectTemplates,
} from "@/modules/projects/template-service";
import { route } from "@/security/route";

export const runtime = "nodejs";
const TEMPLATE_MAX_BYTES=8 * 1024 * 1024;
const privateHeaders={"Cache-Control":"private, no-store"};

async function handleGET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const collegeIds=new URL(request.url).searchParams.getAll("collegeId");
    // Empty/duplicate tenant hints must never degrade into an unscoped list.
    if(collegeIds.length>1||(collegeIds.length===1 &&
      !z.string().uuid().safeParse(collegeIds[0]).success))
      return NextResponse.json({error:"INVALID_COLLEGE_SCOPE"},
        {status:400,headers:privateHeaders});
    const collegeId=collegeIds[0]??null;
    const templates = collegeId
      ? await listAssignedProjectTemplates(
          context,
          collegeId,
        )
      : await listProjectTemplates(context);

    // Preserve vNext {templates} and the legacy admin-list envelope.
    return NextResponse.json({ templates, status: "success",
      message: "Project templates retrieved", data: templates, count: templates.length },
      {headers:privateHeaders});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced", repeatableQuery: ["collegeId"] },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);

async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const parsedBody=await readBoundedJsonBody(request,TEMPLATE_MAX_BYTES);
    if(parsedBody.kind!=="OK")
      return NextResponse.json({error:"INVALID_TEMPLATE",message:"Template payload is required"},
        {status:parsedBody.kind==="TOO_LARGE"?413:400,headers:privateHeaders});
    const body:unknown=parsedBody.value;
    const result = await createProjectTemplate(
      context,
      body,
    );

    return NextResponse.json({ ...result, status: "success",
      message: "Project template created", data: result.template }, {
      status: 201,
      headers: privateHeaders,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const POST = route(
  { auth: "user", permission: "service-enforced", repeatableQuery: ["collegeId"] },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
