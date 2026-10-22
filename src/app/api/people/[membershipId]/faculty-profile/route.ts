import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { getPersonMembershipDetailWithRuntime } from "@/modules/people/runtime";
import { isSuperAdmin } from "@/modules/identity/context";
import {
  getFacultyDocumentForAdmin, patchFacultyDocumentForAdmin,
} from "@/modules/people/faculty-admin-document-service";
import {
 readBoundedFacultyProfileJson,FacultyProfileBodyTooLarge,
} from "@/modules/people/faculty-profile-request-body";
import {
  getFacultyProfileWithRuntime,
  upsertFacultyProfileWithRuntime,
} from "@/modules/people/runtime";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    membershipId: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { membershipId } = await params;
    // Staff full-section view is separate from the legacy academic-only
    // payload. The server verifies the persisted target and college scope.
    if(new URL(request.url).searchParams.get("full")==="1"){
      const person=await getPersonMembershipDetailWithRuntime(context,membershipId);
      const roles=person.membership.roles;
      const protectedRole=roles.includes("COLLEGE_ADMIN")||
        roles.includes("TPO");
      if(!roles.includes("FACULTY")&&!protectedRole)
        return NextResponse.json({error:"MEMBERSHIP_NOT_FOUND"},{status:404});
      // A detail read alone cannot authorize another person's full profile.
      // Revalidate persisted actor permission and target ownership in the
      // shared college-staff document service before loading private sections.
      const found=await getFacultyDocumentForAdmin(context,person.membership.id);
      const parsed=found.document;
      // Receipt IDs are not read URLs and must not be copied from the staff
      // editor into a public profile or used as arbitrary storage grants.
      const safeDocument={...parsed,identitySummary:{
        ...parsed.identitySummary,
        aadhaarDocumentId:null,panDocumentId:null,
      },profileImageDocumentId:null};
      return NextResponse.json({
        profile:{membershipId:person.membership.id,
          profileDocument:safeDocument,profileDocumentVersion:found.version},
        canEdit:roles.includes("FACULTY")&&(!protectedRole||isSuperAdmin(context)),
        readOnlyReason:protectedRole&&!isSuperAdmin(context)
          ?"Protected staff profiles are read-only for College Admins":null,
        roleScope:"COLLEGE_STAFF",
      });
    }
    const profile = await getFacultyProfileWithRuntime(context,membershipId);
    return NextResponse.json({ profile });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { membershipId } = await params;
    const profile = await upsertFacultyProfileWithRuntime(
      context,
      membershipId,
      body,
    );

    return NextResponse.json({ profile });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/** College-admin section editor. Faculty self-edit remains on the separate
 * authenticated self-document route. Only a current people.manage principal
 * may change a tenant-bound Faculty record; ADMIN/TPO profiles are read-only
 * to College Admins. Version CAS rejects overwriting another editor's work.
 */
/** Backward-compatible staff profile editor; shares the persisted actor,
 * target-role protection and CAS of the dedicated faculty-document endpoint. */
export async function PATCH(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try {
  const context=await getCurrentRequestContext();
  const {membershipId}=await params;
  let raw:unknown;
  try{raw=await readBoundedFacultyProfileJson(request);}
  catch(error){return NextResponse.json({
   error:error instanceof FacultyProfileBodyTooLarge?"REQUEST_TOO_LARGE":"INVALID_REQUEST",
  },{status:error instanceof FacultyProfileBodyTooLarge?413:400});}
  const result=await patchFacultyDocumentForAdmin(context,membershipId,raw);
  // This older route never exposes private evidence IDs in a general profile
  // payload. A signed document read uses the separately authorized route.
  const safeDocument={...result.document,identitySummary:{
   ...result.document.identitySummary,
   aadhaarDocumentId:null,panDocumentId:null,
  },profileImageDocumentId:null};
  return NextResponse.json({document:safeDocument,version:result.version,updated:true},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
