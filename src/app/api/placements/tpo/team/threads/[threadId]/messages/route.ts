import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {BoundedFormDataError,readBoundedFormData} from "@/lib/bounded-form-data";
import {AuthorizationError} from "@/modules/permissions/policy";
import {postTpoInternalMessage,TeamAddPeopleRequiredError} from "@/modules/placements/tpo-team-internal-reply-service";
import {internalMessageSchema} from "@/modules/placements/tpo-team-internal-model";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {threadId}=params;
    const form=await readBoundedFormData(request,16*1024);
    const parsed=internalMessageSchema.safeParse({threadId,body:form.get("body"),
   idempotencyKey:form.get("idempotencyKey")||undefined,
   markDecision:form.get("markDecision")==="true",
   mentionMembershipIds:String(form.get("mentionMembershipIds")??"").split(",").filter(Boolean),
   addMentionedMembers:form.get("addMentionedMembers")==="true"});
    if(!parsed.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
    const result=await postTpoInternalMessage(context,parsed.data);
    if(request.headers.get("accept")?.includes("application/json"))
   return NextResponse.json(result);
    return NextResponse.redirect(new URL("/tpo/team/"+threadId,request.url),303);
  },
);
