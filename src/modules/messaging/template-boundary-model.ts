/** Transactional communications may not reuse registered authentication templates. */
const AUTH_TEMPLATE_SEGMENT=/(^|[._:/-])(otp|auth|login|password|recovery|reset|verify)(?=$|[._:/-])/i;
export function isCampaignTemplateKey(key:string):boolean{
 const value=key.trim();
 if(!value || value.length>160 || !/^[a-zA-Z0-9._:/-]+$/.test(value))return false;
 return !AUTH_TEMPLATE_SEGMENT.test(value);
}
