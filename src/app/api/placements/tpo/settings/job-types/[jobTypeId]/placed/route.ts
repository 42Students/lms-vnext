import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {setTpoJobTypeCountsAsPlaced,TpoConfigError} from "@/modules/placements/tpo-job-type-write-service";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobTypeId}=params;
    const body=await request.json() as {countsAsPlaced?:unknown;expectedVersion?:unknown};
    return NextResponse.json(await setTpoJobTypeCountsAsPlaced(__ctx,{
   jobTypeId,countsAsPlaced:body?.countsAsPlaced,expectedVersion:body?.expectedVersion,
  }),{headers:{"Cache-Control":"private, no-store"}});
  },
);
