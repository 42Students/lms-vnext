import {NextResponse} from "next/server";
import {ingestVerifiedInboundMail,VerifiedInboundMailError}
 from "@/modules/inbound-mail/verified-intake-service";
import {readBoundedRecruiterInboundBody} from "@/modules/placements/recruiter-mail-body-model";
import { route } from "@/security/route";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"no-store"} as const;

/**
 * A dedicated provider worker submits a signed, bounded JSON envelope.
 * A browser Origin and URL query controls are never part of the protocol.
 * Reject obviously unsigned input before allocating/parsing request bytes.
 */
async function handlePOST(request:Request){
 if(request.headers.has("origin"))
  return NextResponse.json({error:"FORBIDDEN"},{status:403,headers:noStore});
 const signature=request.headers.get("x-inbound-mail-signature")??"";
 if(!/^[a-f0-9]{64}$/i.test(signature))
  return NextResponse.json({error:"FORBIDDEN"},{status:403,headers:noStore});
 if(new URL(request.url).search)
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers:noStore});
 try{
  const raw=await readBoundedRecruiterInboundBody(request);
  if(raw.kind!=="OK")
   return NextResponse.json({error:"INVALID_BODY"},
     {status:raw.kind==="TOO_LARGE"?413:400,headers:noStore});
  const result=await ingestVerifiedInboundMail(raw.body,signature);
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
export const POST = route(
  { auth: "public", publicReason: "Machine-to-machine endpoint: the handler authenticates the caller with its own shared secret or signature.", csrf: false, csrfExemptReason: "Callers are servers or schedulers and send no browser Origin; the handler checks its credential instead.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
