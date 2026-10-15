import "server-only";
import {verifyUnsubscribeToken} from "@/modules/messaging/unsubscribe-model";
/** A GET preview is read-only. Only the existing same-origin POST persists suppression. */
export async function canPreviewCampaignUnsubscribe(token:string):Promise<boolean>{
 if(token.length>2048)return false;
 return verifyUnsubscribeToken(token,
  process.env.DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64??"",new Date().getTime())!==null;
}
