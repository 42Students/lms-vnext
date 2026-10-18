import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoPublicJoinLinkStatus} from "@/modules/placements/tpo-public-join-link-service";
export const runtime="nodejs";
/** TPO-companies-R02: scoped readback; never returns the original secret token. */
export async function GET(request:Request){
 try{
  const search=new URL(request.url).searchParams;
  // TPO-settings-audit-55: reject repeated or smuggled selectors instead of
  // silently picking the first scope, even on an otherwise read-only GET.
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
  const state=await getTpoPublicJoinLinkStatus(await getCurrentRequestContext(),
   input.scope,input.scope==="COMPANY"?input.companyId:undefined);
  return NextResponse.json(state,{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_QUERY"},{status:400});
  return apiErrorResponse(error);
 }
}
