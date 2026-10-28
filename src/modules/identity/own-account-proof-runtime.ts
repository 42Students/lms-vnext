import "server-only";

import {createExotelSmsProvider} from "@/modules/notifications/exotel-sms";
import {createZeptoMailEmailProvider} from "@/modules/notifications/zeptomail-email";
import {
 issueScopedAccountProof,
 type ScopedAccountProofRequest,
} from "@/modules/identity/scoped-account-verification-service";

/** No external sends in local/E2E/test execution. Real provider configuration
 * and acceptance are mandatory; there is no dev code echo or mock success. */
export async function issueOwnAccountProofWithProvider(request:ScopedAccountProofRequest){
 const live=process.env["APP_ENV"]==="production"||
  process.env["AUTH_DEV_REAL_DELIVERY"]==="VERIFIED";
 if(!live)throw new Error("ROLE_PROOF_DELIVERY_DISABLED");
 return issueScopedAccountProof(request,async ({channel,to,code})=>{
  const accepted=channel==="PHONE"
   ?await createExotelSmsProvider().sendOtp(to,code)
   :await createZeptoMailEmailProvider().sendOtpEmail({
     toEmail:to,displayName:"there",code,
    });
  if(!accepted)throw new Error("ROLE_PROOF_DELIVERY_FAILED");
 });
}
