import {NextResponse} from "next/server";
import {sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {isSameOriginRequest} from "@/auth/origin";
import {verifyUnsubscribeToken} from "@/modules/messaging/unsubscribe-model";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const form=await request.formData().catch(()=>null);
 const rawToken=form?.get("token");
 if(typeof rawToken!=="string"||rawToken.length>2048)return NextResponse.json({error:"INVALID_TOKEN"},{status:400});
 const claim=verifyUnsubscribeToken(rawToken,process.env.DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64??"",Date.now());
 if(!claim)return NextResponse.json({error:"INVALID_TOKEN"},{status:400});
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
