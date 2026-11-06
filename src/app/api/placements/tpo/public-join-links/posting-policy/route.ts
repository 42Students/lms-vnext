import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoSettingsBody,TpoCommunicationBodyError} from "@/modules/placements/tpo-communication-request-model";
import {getPublicJoinPostingPolicy,setPublicJoinPostingPolicy} from "@/modules/placements/tpo-public-join-posting-policy-service";
import {TpoPublicJoinLinkError} from "@/modules/placements/tpo-public-join-link-service";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const search=new URL(request.url).searchParams,keys=[...search.keys()];
    if(keys.length!==new Set(keys).size||keys.some(key=>key!=="scope"&&key!=="companyId"))
   return NextResponse.json({error:"INVALID_QUERY"},{status:400});
    const input=z.discriminatedUnion("scope",[
   z.strictObject({scope:z.literal("COLLEGE")}),
   z.strictObject({scope:z.literal("COMPANY"),companyId:z.string().uuid()}),
  ]).parse(search.get("scope")==="COMPANY"
   ?{scope:"COMPANY",companyId:search.get("companyId")}
   :{scope:search.get("scope"),...(search.has("companyId")?{companyId:search.get("companyId")}:{})});
    const value=await getPublicJoinPostingPolicy(__ctx,
   input.scope,input.scope==="COMPANY"?input.companyId:undefined);
    return NextResponse.json(value,{headers:{"Cache-Control":"private, no-store"}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const value=await setPublicJoinPostingPolicy(__ctx,
   await readTpoSettingsBody(request));
    return NextResponse.json(value,{headers:{"Cache-Control":"private, no-store"}});
  },
);
