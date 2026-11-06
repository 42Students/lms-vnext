import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {leaveOwnGroup} from "@/modules/groups/service";
import {getLearnerGroupDetail} from "@/modules/groups/learner-group-detail-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {groupId}=params;
    if(!await getLearnerGroupDetail(context,groupId))
   return NextResponse.json({error:"GROUP_NOT_FOUND"},{status:404});
    await leaveOwnGroup(context,groupId);
    const group=await getLearnerGroupDetail(context,groupId);
    return NextResponse.json(group,{headers:{"Cache-Control":"private, no-store"}});
  },
);
