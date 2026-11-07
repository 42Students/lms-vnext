import {NextResponse} from "next/server";
import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {readBoundedJsonBody} from "@/lib/bounded-json-body";
import {recordPublicJoinOpen} from "@/modules/placements/public-join/open-service";
import { route } from "@/security/route";
export const runtime="nodejs";
const schema=z.strictObject({token:z.string().min(32).max(256),scope:z.enum(["COLLEGE","COMPANY"])});
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const body=await readBoundedJsonBody(request);
 if(body.kind==="TOO_LARGE")return NextResponse.json({error:"INVALID_BODY"},
  {status:413,headers:{"Cache-Control":"no-store"}});
 const input=schema.safeParse(body.kind==="OK"?body.value:null);
 if(!input.success)return NextResponse.json({error:"INVALID_BODY"},
  {status:400,headers:{"Cache-Control":"no-store"}});
 try{
  const opened=await recordPublicJoinOpen(input.data.token,input.data.scope);
  return NextResponse.json({opened},{headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({error:"SERVICE_UNAVAILABLE"},
   {status:503,headers:{"Cache-Control":"no-store"}});
 }
}
export const POST = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", csrf: false, csrfExemptReason: "Links and email clients send no same-origin header; the handler validates the token or applies its own origin check.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
