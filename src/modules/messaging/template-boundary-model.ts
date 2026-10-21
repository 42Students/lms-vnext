/** Transactional communications may not reuse registered authentication templates. */
const AUTH_TEMPLATE_SEGMENT=/(^|[._:/-])(otp|auth|login|password|recovery|reset|verify|mfa|2fa|sign-?in|passcode|one-?time|magic-?link)(?=$|[._:/-])/i;
export function isCampaignTemplateKey(key:string):boolean{
 const value=key.trim();
 if(!value || value.length>160 || !/^[a-zA-Z0-9](?:[a-zA-Z0-9._:/-]*[a-zA-Z0-9])?$/.test(value))return false;
 return !AUTH_TEMPLATE_SEGMENT.test(value);
}

/** Legacy TpoMailService.nameForEvent mapped OFFER_RELEASED to
 * offer-released. Resolve only through trusted operator-provisioned keys;
 * a valid historical event does not authorize a send or invent a template.
 */
export function resolveLegacyTpoMailTemplate(
 event:string,
 configured:Readonly<Record<string,string>>,
):string|null {
 const name=event.trim().toUpperCase();
 if(!/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/.test(name)||name.length>100)
  return null;
 const legacyKey=name.toLowerCase().replaceAll("_","-");
 const template=configured[name]??configured[legacyKey];
 return template&&isCampaignTemplateKey(template)?template:null;
}
