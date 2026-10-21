import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { bulkReassignProjectMentor } from "@/modules/projects/member-service";
import {findLegacyReassignmentMentorMembership}
  from "@/modules/projects/mentor-reassignment-legacy-lookup-service";
import {z} from "zod";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const input: unknown = await request.json();
    let normalized:unknown=input;
    if(input && typeof input==="object" && !Array.isArray(input) &&
       "mentorId" in input){
      const raw=input as Record<string,unknown>;
      // Reject mixed identities; an attacker must not choose the namespace
      // that gives them a more permissive mentor candidate.
      if("mentorMembershipId" in raw)
        return NextResponse.json({error:"AMBIGUOUS_MENTOR_ID"},{status:400});
      const college=z.string().uuid().safeParse(raw.collegeId);
      const legacy=raw.mentorId;
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
        normalized,
      );
    return NextResponse.json({...result,
      partialSuccess:result.failures.length>0&&result.reassignedCount>0,
      failedProjects:result.failures,
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
