import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { facultyProfiles } from "@/db/schema";
import { getPersonMembershipDetailWithRuntime } from "@/modules/people/runtime";
import { PeopleServiceError } from "@/modules/people/errors";
import { facultyProfileDocumentSchema } from "@/modules/people/faculty-profile-document";
import {
 facultySelfSectionPatchSchema, updateFacultyProfileSection,
} from "@/modules/people/faculty-self-section-model";
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
      const [found]=await getDb().select({
        document:facultyProfiles.profileDocument,
        version:facultyProfiles.profileDocumentVersion,
      }).from(facultyProfiles)
        .where(eq(facultyProfiles.membershipId,person.membership.id)).limit(1);
      const parsed=facultyProfileDocumentSchema.parse(found?.document??{});
      // Receipt IDs are not read URLs and must not be copied from the staff
      // editor into a public profile or used as arbitrary storage grants.
      const safeDocument={...parsed,identitySummary:{
        ...parsed.identitySummary,
        aadhaarDocumentId:null,panDocumentId:null,
      },profileImageDocumentId:null};
      return NextResponse.json({
        profile:{membershipId:person.membership.id,
          profileDocument:safeDocument,profileDocumentVersion:found?.version??0},
        canEdit:roles.includes("FACULTY")&&!protectedRole,
        readOnlyReason:protectedRole?"Protected staff profiles are read-only for College Admins":null,
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
export async function PATCH(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {membershipId}=await params;
  const person=await getPersonMembershipDetailWithRuntime(context,membershipId);
  if(!person.membership.roles.includes("FACULTY")||
     person.membership.roles.includes("COLLEGE_ADMIN")||
     person.membership.roles.includes("TPO"))
    return NextResponse.json({error:"PROFILE_READ_ONLY"},{status:403});
  let raw:unknown;
  try{raw=await readBoundedFacultyProfileJson(request);}
  catch(error){return NextResponse.json({
    error:error instanceof FacultyProfileBodyTooLarge?"REQUEST_TOO_LARGE":"INVALID_REQUEST",
   },{status:error instanceof FacultyProfileBodyTooLarge?413:400});}
  const input=facultySelfSectionPatchSchema.parse(raw);
  const result=await getDb().transaction(async tx=>{
    const [existing]=await tx.select({
      document:facultyProfiles.profileDocument,
      version:facultyProfiles.profileDocumentVersion,
    }).from(facultyProfiles).where(
      eq(facultyProfiles.membershipId,person.membership.id))
      .for("update").limit(1);
    if(!existing)throw new PeopleServiceError("MEMBERSHIP_NOT_FOUND");
    if(existing.version!==input.expectedVersion)
      throw new PeopleServiceError("FACULTY_PROFILE_VERSION_CONFLICT");
    const current=facultyProfileDocumentSchema.parse(existing.document??{});
    const next=updateFacultyProfileSection(current,input);
    await tx.update(facultyProfiles).set({
      profileDocument:next,
      profileDocumentVersion:sql`${facultyProfiles.profileDocumentVersion}+1`,
      updatedAt:new Date(),
    }).where(eq(facultyProfiles.membershipId,person.membership.id));
    return {document:next,version:existing.version+1};
  });
  return NextResponse.json({...result,updated:true});
 }catch(error){return apiErrorResponse(error);}
}
