import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {joinGroup,leaveGroup} from "@/modules/groups/service";
import { ROLE } from "@/modules/identity/roles";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    if(!hasMembershipRole(context,ROLE.LEARNER)||!context.membership)throw new AuthorizationError("academics.read");
    const {groupId}=params;
    const id=z.uuid().parse(groupId);
    const input=z.strictObject({action:z.enum(["JOIN","LEAVE"])}).parse(await boundedRequestJson(request));
    const membership=input.action==="JOIN"?
   await joinGroup(context,id,context.membership.id,"SELF"):
   await leaveGroup(context,id,context.membership.id,"SELF");
    return NextResponse.json({group:{id,memberState:membership.state==="REMOVED"?null:membership.state}},
   {headers:{"Cache-Control":"private, no-store"}});
  },
);
