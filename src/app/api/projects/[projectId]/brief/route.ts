import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {updateProjectWorkspaceBrief} from "@/modules/projects/workspace-brief-service";
import {z} from "zod";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {projectId}=params;
    const payload:unknown=await boundedRequestJson(request);
    const legacy=z.strictObject({
   detailsToken:z.iso.datetime({offset:true}),
   overview:z.object({
    goal:z.string().optional(),description:z.string().optional(),
    deliverables:z.array(z.string()).optional(),
    definitionOfDone:z.array(z.string()).optional(),
    personas:z.array(z.string()).optional(),
   }).passthrough(),
  }).safeParse(payload);
    const input=legacy.success?{
   expectedUpdatedAt:legacy.data.detailsToken,
   brief:{
    goal:legacy.data.overview.goal??"",
    description:legacy.data.overview.description??"",
    deliverables:legacy.data.overview.deliverables??[],
    completionConditions:legacy.data.overview.definitionOfDone??[],
    personas:legacy.data.overview.personas??[],
   },
  }:payload;
    return NextResponse.json(await updateProjectWorkspaceBrief(context,projectId,input));
  },
);
