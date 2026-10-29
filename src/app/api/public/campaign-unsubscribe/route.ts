import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
import {verifyUnsubscribeToken} from "@/modules/messaging/unsubscribe-model";
import {verifyTpoCampaignRecipientToken,resolveTpoCampaignRecipientSecret} from "@/modules/messaging/tpo-campaign-recipient-token";
import {CampaignUnsubscribeInvalid,unsubscribeTpoCampaignRecipient} from "@/modules/messaging/tpo-campaign-unsubscribe-service";
import {GlobalEmailSuppressionUnavailable,persistVerifiedGlobalEmailSuppression} from "@/modules/operations/global-email-suppression-service";
export const runtime="nodejs";
/** Do not acknowledge a signed opt-out when its recipient table has not
 * been deployed. Public callers get a generic retryable state, never a
 * recipient-lookup oracle or a false "unsubscribed" confirmation. */
function recipientStorageUnavailable(error:unknown):NextResponse|null {
 if(!(error instanceof Error)||error.message!=="TPO_CAMPAIGNS_NOT_REGISTERED")return null;
 return NextResponse.json({error:"SUPPRESSIONS_NOT_READY",message:"That didn't work. Please try again."},{
  status:503,headers:{"Cache-Control":"no-store"},
 });
}
function successResponse(request:Request,scope:"placement-cell"|null){
 // Legacy inline confirm pages can request JSON and keep their current URL.
 // Existing native-form integrations retain the confirmed-page 303 fallback.
 const wantsJson=(request.headers.get("accept")??"").toLowerCase().includes("application/json") ||
  (request.headers.get("prefer")??"").toLowerCase().includes("return=representation");
 if(wantsJson)return NextResponse.json({status:"UNSUBSCRIBED",inPlace:true,scope},{
  status:200,headers:{"Cache-Control":"no-store"},
 });
 const url=new URL("/campaign-unsubscribe/confirmed",request.url);
 if(scope==="placement-cell")url.searchParams.set("scope","placement-cell");
 const response=NextResponse.redirect(url,303);
 response.headers.set("Cache-Control","no-store");
 return response;
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 // A public POST must not parse an unbounded multipart or URL-encoded body.
 // Reconstruct only the bounded UTF-8 bytes for the same native form parser.
 const body=await readBoundedUtf8Body(request,8192);
 if(body.kind==="TOO_LARGE")return NextResponse.json({error:"INVALID_OR_EXPIRED_LINK"},
  {status:413,headers:{"Cache-Control":"no-store"}});
 if(body.kind!=="OK")return NextResponse.json({error:"INVALID_OR_EXPIRED_LINK"},
  {status:400,headers:{"Cache-Control":"no-store"}});
 const input=new Request(request.url,{method:"POST",body:body.body,
  headers:{"content-type":request.headers.get("content-type")??""}});
 const form=await input.formData().catch(()=>null);
 const rawToken=form?.get("token");
 if(typeof rawToken!=="string"||!rawToken.trim()||rawToken.length>2048)
  return successResponse(request,"placement-cell");
 const tpoClaim=verifyTpoCampaignRecipientToken(rawToken,resolveTpoCampaignRecipientSecret(process.env),Date.now());
 if(tpoClaim){
  try{
   await unsubscribeTpoCampaignRecipient(rawToken);
   return successResponse(request,"placement-cell");
  }catch(e){
   if(e instanceof CampaignUnsubscribeInvalid)
    return successResponse(request,"placement-cell");
   const unavailable=recipientStorageUnavailable(e);
   if(unavailable)return unavailable;
   throw e;
  }
 }
 // Legacy SHA256 links may have no current HMAC payload. Resolve only
 // against the purpose-specific migrated digest, never from an email query.
 if(!rawToken.includes(".")&&rawToken.length<=200){
  // Legacy opaque tokens (max 200 chars) are recognized by their migrated
  // digest only. Reusing one does not reveal whether an address existed.
  try {
   await unsubscribeTpoCampaignRecipient(rawToken);
   return successResponse(request,"placement-cell");
  }catch(e){
   if(e instanceof CampaignUnsubscribeInvalid)
    return successResponse(request,"placement-cell");
   const unavailable=recipientStorageUnavailable(e);
   if(unavailable)return unavailable;
   throw e;
  }
 }
 const claim=verifyUnsubscribeToken(rawToken,process.env["DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64"]??"",Date.now());
 // Do not expose whether a guessed or old one-click token matches a recipient.
 // The legacy public controller acknowledged both already-cleared and unknown
 // links identically; only verified claims ever reach the suppression writer.
 if(!claim)return successResponse(request,"placement-cell");
 // The signed global token supplies a verified HMAC only. Never derive a
 // suppression key from a caller-controlled address or use an ad-hoc INSERT:
 // this writer atomically terminalizes matching unclaimed queued EMAIL rows.
 try{
  await persistVerifiedGlobalEmailSuppression({
   recipientHash:claim.recipientKey,reason:"UNSUBSCRIBED",
  });
 }catch(error){
  if(error instanceof GlobalEmailSuppressionUnavailable)
   return NextResponse.json({
    error:"SUPPRESSIONS_NOT_READY",message:"That didn't work. Please try again.",
   },{status:503,headers:{"Cache-Control":"no-store"}});
  throw error;
 }
 return successResponse(request,null);
}
