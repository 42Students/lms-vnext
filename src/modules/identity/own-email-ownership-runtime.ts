import "server-only";

import type {EmailLinkScope} from "@/modules/identity/email-link-verification-service";
import {issueEmailOwnershipLink,redeemEmailOwnershipLink} from "@/modules/identity/email-link-verification-service";
import {sendZeptoMailTemplate} from "@/modules/notifications/zeptomail-email";

/** Sends only through the independently provisioned ownership-link template.
 * Never produce a token in an API response or a server-access-log URL. */
export async function issueOwnEmailOwnershipLink(
 scope:EmailLinkScope,origin:string,
){
 if(process.env["APP_ENV"]!=="production" &&
    process.env["AUTH_DEV_REAL_DELIVERY"]!=="VERIFIED")
  throw new Error("EMAIL_LINK_DELIVERY_DISABLED");
 const base=new URL(origin);
 if(base.origin!==origin ||
   (base.protocol!=="https:" &&
    !(process.env.NODE_ENV!=="production" &&
      base.protocol==="http:" &&
      ["localhost","127.0.0.1","[::1]"].includes(base.hostname))))
  throw new Error("EMAIL_LINK_DELIVERY_DISABLED");
 return issueEmailOwnershipLink(scope,async ({to,token})=>{
  // Fragment never reaches web servers, redirect logs or Referer headers.
  // The page removes the fragment before posting it to the same-host API.
  const verificationUrl=base.origin+"/verify-email#token="+encodeURIComponent(token);
  const result=await sendZeptoMailTemplate({
   purpose:{kind:"EMAIL_OWNERSHIP_LINK"},
   toEmail:to,
   mergeInfo:{verificationUrl,expiryHours:"24"},
  });
  if(!result.accepted)throw new Error("EMAIL_LINK_DELIVERY_FAILED");
 });
}

export async function redeemOwnEmailOwnershipLink(token:string,scope:EmailLinkScope){
 return redeemEmailOwnershipLink(token,scope);
}
