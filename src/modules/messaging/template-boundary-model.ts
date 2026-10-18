/** Transactional communications may not reuse registered authentication templates. */
const AUTH_TEMPLATE_SEGMENT=/(^|[._:/-])(otp|auth|login|password|recovery|reset|verify|mfa|2fa|sign-?in|passcode|one-?time|magic-?link)(?=$|[._:/-])/i;
export function isCampaignTemplateKey(key:string):boolean{
 const value=key.trim();
 if(!value || value.length>160 || !/^[a-zA-Z0-9](?:[a-zA-Z0-9._:/-]*[a-zA-Z0-9])?$/.test(value))return false;
 return !AUTH_TEMPLATE_SEGMENT.test(value);
}
