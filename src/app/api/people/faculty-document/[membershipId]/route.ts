import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedFacultyProfileJson,FacultyProfileBodyTooLarge} from "@/modules/people/faculty-profile-request-body";
import {getFacultyDocumentForAdmin,patchFacultyDocumentForAdmin} from "@/modules/people/faculty-admin-document-service";

export const runtime="nodejs";
type Params={params:Promise<{membershipId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {membershipId}=params;
    return NextResponse.json(await getFacultyDocumentForAdmin(__ctx,membershipId),
   {headers:{"Cache-Control":"private, no-store"}});
  },
);
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {membershipId}=params;
    let body:unknown;
    try{body=await readBoundedFacultyProfileJson(request);}
  catch(error){return NextResponse.json({error:error instanceof FacultyProfileBodyTooLarge?
   "REQUEST_TOO_LARGE":"INVALID_REQUEST"},{status:error instanceof FacultyProfileBodyTooLarge?413:400});}
    const value=await patchFacultyDocumentForAdmin(__ctx,membershipId,body);
    return NextResponse.json(value,{headers:{"Cache-Control":"private, no-store"}});
  },
);
export const PUT=PATCH;
