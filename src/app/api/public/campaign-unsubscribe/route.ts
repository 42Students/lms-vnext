import {NextResponse} from "next/server";
import {sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {isSameOriginRequest} from "@/auth/origin";
import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
import {verifyUnsubscribeToken} from "@/modules/messaging/unsubscribe-model";
import {verifyTpoCampaignRecipientToken,resolveTpoCampaignRecipientSecret} from "@/modules/messaging/tpo-campaign-recipient-token";
import {CampaignUnsubscribeInvalid,unsubscribeTpoCampaignRecipient} from "@/modules/messaging/tpo-campaign-unsubscribe-service";
export const runtime="nodejs";
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
 if(typeof rawToken!=="string"||rawToken.length>2048)
  return NextResponse.json({error:"INVALID_OR_EXPIRED_LINK"},{status:400});
 const tpoClaim=verifyTpoCampaignRecipientToken(rawToken,resolveTpoCampaignRecipientSecret(process.env),Date.now());
 if(tpoClaim){
  try{
   await unsubscribeTpoCampaignRecipient(rawToken);
   return NextResponse.redirect(new URL("/campaign-unsubscribe/confirmed?scope=placement-cell",request.url),303);
  }catch(e){
   if(e instanceof CampaignUnsubscribeInvalid)
    return NextResponse.json({error:"INVALID_OR_EXPIRED_LINK"},{status:400});
   throw e;
  }
 }
 const claim=verifyUnsubscribeToken(rawToken,process.env.DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64??"",Date.now());
 if(!claim)return NextResponse.json({error:"INVALID_OR_EXPIRED_LINK"},{status:400});
 const db=getDb();
 const exists=await db.execute<{ready:boolean}>(sql`select to_regclass('public.outbound_global_email_suppressions') is not null as ready`);
 if(exists.rows[0]?.ready!==true)return NextResponse.json({error:"SUPPRESSIONS_NOT_READY"},{status:503});
 // The global HMAC is already signed in the token; never accept an email address from the request.
 await db.execute(sql`
  insert into outbound_global_email_suppressions (recipient_hash,reason)
  values (${claim.recipientKey}::varchar,'UNSUBSCRIBED')
  on conflict (recipient_hash) where cleared_at is null do nothing
 `);
 return NextResponse.redirect(new URL("/campaign-unsubscribe/confirmed",request.url),303);
}
