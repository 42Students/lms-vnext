import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { loadOwnFacultyProfileDocumentStaged } from "@/modules/people/faculty-profile-self.staged";
import { patchOwnFacultyProfileSection } from "@/modules/people/faculty-self-section-service";
import {facultySelfEditableSection} from "@/modules/people/faculty-self-section-model";
import {FACULTY_LEGACY_PROFILE_COMPATIBILITY} from "@/modules/people/faculty-legacy-compatibility";
import {z} from "zod";
import { readBoundedFacultyProfileJson,FacultyProfileBodyTooLarge } from "@/modules/people/faculty-profile-request-body";

export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    if(new URL(request.url).searchParams.get("compatibility")==="legacy")
    return NextResponse.json({routes:FACULTY_LEGACY_PROFILE_COMPATIBILITY},
      {headers:{"Cache-Control":"private, no-store"}});
    const current=await loadOwnFacultyProfileDocumentStaged(context);
    const section=new URL(request.url).searchParams.get("section");
    if(section===null)return NextResponse.json({
    ...current,
    selfProfileHref:"/teacher/profile",
    collegeAdminProfileHref:null,
  },{headers:{"Cache-Control":"private, no-store"}});
    const parsed=facultySelfEditableSection.safeParse(section);
    if(!parsed.success)return NextResponse.json({error:"INVALID_SECTION"},{status:400});
    return NextResponse.json({section:parsed.data,value:current.document[parsed.data],
    version:current.version},{headers:{"Cache-Control":"private, no-store"}});
  },
);
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    let body:unknown;
    try{body=await readBoundedFacultyProfileJson(request);}catch(error){
   return NextResponse.json({error:error instanceof FacultyProfileBodyTooLarge?"REQUEST_TOO_LARGE":"INVALID_REQUEST"},
    {status:error instanceof FacultyProfileBodyTooLarge?413:400});
  }
    const result=await patchOwnFacultyProfileSection(context,body);
    return NextResponse.json({...result,profileCompletenessRefresh:true},
   {headers:{"Cache-Control":"private, no-store"}});
  },
);

/** Legacy sections POST/PUT aliases use the same authenticated, versioned
 * document CAS as PATCH; no arbitrary target membership is trusted here. */
export const PUT=PATCH;
export const POST=PATCH;

/** Repeatable-section removal by stable entry ID, never by unstable list index.
 * Scalar sections cannot be deleted through the compatibility adapter. */
const deleteInput=z.strictObject({
 section:z.enum(["languages","education","certifications","experiences","skills",
  "publications","awards"]),
 id:z.string().uuid(),
 expectedVersion:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
});
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    let body:unknown;
    try{body=await readBoundedFacultyProfileJson(request);}
  catch(error){return NextResponse.json({error:error instanceof FacultyProfileBodyTooLarge?
   "REQUEST_TOO_LARGE":"INVALID_REQUEST"},{status:error instanceof FacultyProfileBodyTooLarge?413:400});}
    const input=deleteInput.parse(body);
    const current=await loadOwnFacultyProfileDocumentStaged(context);
    if(current.version!==input.expectedVersion)
   return NextResponse.json({error:"FACULTY_PROFILE_VERSION_CONFLICT"},{status:409});
    const currentRows=current.document[input.section];
    const next=currentRows.filter(item=>item.id!==input.id);
    if(next.length===currentRows.length)
   return NextResponse.json({error:"PROFILE_ENTRY_NOT_FOUND"},{status:404});
    const result=await patchOwnFacultyProfileSection(context,{
   section:input.section,value:next,expectedVersion:input.expectedVersion,
  });
    return NextResponse.json({...result,removedEntryId:input.id,
    profileCompletenessRefresh:true},{headers:{"Cache-Control":"private, no-store"}});
  },
);
