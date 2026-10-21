import {NextResponse} from "next/server";
import {ingestVerifiedInboundMail,VerifiedInboundMailError}
 from "@/modules/inbound-mail/verified-intake-service";
import {readBoundedRecruiterInboundBody} from "@/modules/placements/recruiter-mail-body-model";

export const runtime="nodejs";
export async function POST(request:Request){
 const noStore={"Cache-Control":"no-store"};
 try{
  const raw=await readBoundedRecruiterInboundBody(request);
  if(raw.kind!=="OK")
   return NextResponse.json({error:"INVALID_BODY"},
     {status:raw.kind==="TOO_LARGE"?413:400,headers:noStore});
  const result=await ingestVerifiedInboundMail(raw.body,
    request.headers.get("x-inbound-mail-signature")??"");
  // Private worker ACK: never expose routing status, sender or recipient.
  return NextResponse.json({accepted:result.accepted,replayed:result.replayed},
    {headers:noStore});
 }catch(error){
  if(error instanceof VerifiedInboundMailError){
   const status=error.code==="INVALID_SIGNATURE"?403:
    error.code==="INVALID_PAYLOAD"?400:503;
   return NextResponse.json({error:status===503?"SERVICE_UNAVAILABLE":
    status===403?"FORBIDDEN":"INVALID_BODY"},{status,headers:noStore});
  }
  return NextResponse.json({error:"SERVICE_UNAVAILABLE"},{status:503,headers:noStore});
 }
}
