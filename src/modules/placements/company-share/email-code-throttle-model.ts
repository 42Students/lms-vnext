/** Legacy TpoShareService enforces one emailed code per minute and five
 * successfully mailed codes per rolling hour, per share. Both conditions are
 * checked after the share row is locked and only successful audit events
 * count toward the limit. The one-minute warning has precedence. */
export const COMPANY_SHARE_EMAILS_PER_HOUR=5;
export const COMPANY_SHARE_EMAIL_MINUTE_MS=60_000;
export const COMPANY_SHARE_EMAIL_HOUR_MS=60*COMPANY_SHARE_EMAIL_MINUTE_MS;
export function companyShareEmailThrottle(
 sentAt:readonly Date[],now:Date,
):"TOO_SOON"|"LIMITED"|null{
 if(!Number.isFinite(now.getTime()))throw new Error("Invalid share-email clock");
 const valid=sentAt.map(date=>date.getTime()).filter(time=>Number.isFinite(time)&&
  time<=now.getTime()&&now.getTime()-time<COMPANY_SHARE_EMAIL_HOUR_MS);
 if(valid.some(time=>now.getTime()-time<COMPANY_SHARE_EMAIL_MINUTE_MS))return "TOO_SOON";
 return valid.length>=COMPANY_SHARE_EMAILS_PER_HOUR?"LIMITED":null;
}
