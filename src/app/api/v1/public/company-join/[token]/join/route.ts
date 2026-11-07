import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {readBoundedJsonBody} from "@/lib/bounded-json-body";
import {acceptPublicRecruiterJoin,PublicJoinAcceptError} from "@/modules/placements/public-join/join-service";
import {z} from "zod";
import { route } from "@/security/route";
export const runtime="nodejs";
const legacy=z.strictObject({
 email:z.string().email().max(254),code:z.string().regex(/^[0-9]{6}$/),
 firstName:z.string().trim().min(1).max(100),
 lastName:z.string().trim().min(1).max(100),
 designation:z.string().trim().max(150).optional(),
 phone:z.string().trim().max(14).optional(),
});
/** The old API names first/last separately, while the vNext account stores a
 * displayName. Join authority still comes only from the hashed URL token and
 * a fresh OTP, never from a collegeId or companyId supplied by the caller.
 */
async function handlePOST(request:Request,{params}:{params:Promise<{token:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const body=await readBoundedJsonBody(request);
 if(body.kind!=="OK")return NextResponse.json({error:"INVALID_REQUEST"},{status:body.kind==="TOO_LARGE"?413:400});
 const parsed=legacy.safeParse(body.value);
 if(!parsed.success)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 const {token}=await params;
 const trusted=process.env["PUBLIC_JOIN_TRUSTED_PROXY_READY"]==="VERIFIED";
 const ip=trusted?request.headers.get("x-public-verified-client-ip"):null;
 try{
  const input=parsed.data;
  const joined=await acceptPublicRecruiterJoin("COMPANY",{
   token,email:input.email,code:input.code,name:input.firstName+" "+input.lastName,
   designation:input.designation??"",phone:input.phone??"",companyName:"",
  },ip);
  return NextResponse.json(joined,{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  const code=error instanceof PublicJoinAcceptError?error.code:"SERVICE_UNAVAILABLE";
  const unavailable=["NETWORK_GUARD_NOT_READY","NOT_CONFIGURED","PHONE_STORAGE_NOT_READY","SERVICE_UNAVAILABLE"].includes(code);
  return NextResponse.json({error:code==="REMOVED"?"ACCESS_REMOVED":unavailable?"SERVICE_NOT_READY":code},
   {status:unavailable?503:code==="RATE_LIMITED"?429:400,headers:{"Cache-Control":"no-store"}});
 }
}
export const POST = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", csrf: false, csrfExemptReason: "Links and email clients send no same-origin header; the handler validates the token or applies its own origin check.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
