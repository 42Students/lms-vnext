import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoInterviewSlotWorkspace,mutateTpoInterviewSlots} from "@/modules/placements/tpo-interview-slot-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string;roundId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId,roundId}=params;
    return NextResponse.json(await getTpoInterviewSlotWorkspace(__ctx,jobId,roundId),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request: req, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId,roundId}=params;
    return NextResponse.json(await mutateTpoInterviewSlots(__ctx,jobId,roundId,await boundedRequestJson(req)),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
