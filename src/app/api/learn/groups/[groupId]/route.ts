import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getLearnerGroupDetail} from "@/modules/groups/learner-group-detail-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {groupId}=params;
    const group=await getLearnerGroupDetail(context,groupId);
    if(!group)return NextResponse.json({error:"GROUP_NOT_FOUND"},{status:404});
    return privateJson(group);
  },
);
