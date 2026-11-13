import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoPublicJoinLinkStatus} from "@/modules/placements/tpo-public-join-link-service";
import { noStoreJson } from "@/security/responses";
export const runtime="nodejs";
/** TPO-companies-R02: scoped readback; never returns the original secret token. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
const search=new URL(request.url).searchParams;
const keys=[...search.keys()];
if(keys.length!==new Set(keys).size||
     keys.some(key=>key!=="scope"&&key!=="companyId")||
     (search.get("scope")==="COLLEGE"&&search.has("companyId")))
   return NextResponse.json({error:"INVALID_QUERY"},{status:400});
const input=z.discriminatedUnion("scope",[
   z.strictObject({scope:z.literal("COLLEGE")}),
   z.strictObject({scope:z.literal("COMPANY"),companyId:z.string().uuid()}),
  ]).parse(search.get("scope")==="COMPANY"
   ?{scope:"COMPANY",companyId:search.get("companyId")}
   :{scope:search.get("scope")});
const state=await getTpoPublicJoinLinkStatus(__ctx,
   input.scope,input.scope==="COMPANY"?input.companyId:undefined);
return noStoreJson(state);
} catch(error){
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_QUERY"},{status:400});
  return apiErrorResponse(error);
 }
  },
);
