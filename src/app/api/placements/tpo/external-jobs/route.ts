import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {createPublicExternalJobLink} from "@/modules/placements/public-external-job-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const json:unknown=await request.json();
    const jobId=json&&typeof json==="object"&&!Array.isArray(json)&&"jobId" in json
   ?(json as {jobId:unknown}).jobId:null;
    return NextResponse.json(await createPublicExternalJobLink(
   __ctx,jobId),{headers:{"Cache-Control":"private, no-store"}});
  },
);
