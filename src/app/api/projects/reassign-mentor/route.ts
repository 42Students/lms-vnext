import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { bulkReassignProjectMentor } from "@/modules/projects/member-service";
import {findLegacyReassignmentMentorMembership}
  from "@/modules/projects/mentor-reassignment-legacy-lookup-service";
import {z} from "zod";
import {bulkProjectMentorReassignmentInputSchema} from "@/modules/projects/validation";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const input: unknown = await boundedRequestJson(request);
    let normalized:unknown=input;
    if(input && typeof input==="object" && !Array.isArray(input) &&
       "mentorId" in input){
      const raw=input as Record<string,unknown>;
      // Reject mixed identities; an attacker must not choose the namespace
      // that gives them a more permissive mentor candidate.
      if("mentorMembershipId" in raw)
        return NextResponse.json({error:"AMBIGUOUS_MENTOR_ID"},{status:400});
      const college=z.string().uuid().safeParse(raw["collegeId"]);
      const legacy=raw["mentorId"];
      const value=typeof legacy==="number"&&Number.isSafeInteger(legacy)?
        String(legacy):typeof legacy==="string"?legacy:"";
      if(!college.success||!/^[1-9][0-9]{0,14}$/.test(value)||
         !Number.isSafeInteger(Number(value)))
        return NextResponse.json({error:"INVALID_LEGACY_MENTOR_ID"},{status:400});
      // Same selected college, current active Mentor role, persisted actor.
      // A missing crosswalk fails closed rather than reassigning a guessed ID.
      const resolved=await findLegacyReassignmentMentorMembership(
        context,college.data,Number(value));
      if(!resolved)
        return NextResponse.json({error:"LEGACY_MENTOR_NOT_MAPPED"},{status:400});
      const {mentorId:ignored,...remaining}=raw;
      normalized={...remaining,mentorMembershipId:resolved};
    }
    const result =
      await bulkReassignProjectMentor(
        context,
        bulkProjectMentorReassignmentInputSchema.parse(normalized),
      );
    return NextResponse.json({...result,
      partialSuccess:result.failures.length>0&&result.reassignedCount>0,
      failedProjects:result.failures,
    },{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
