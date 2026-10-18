import {
 collegeBrandingInputSchema,type CollegeBrandingInput,
} from "./branding";

const {shape}=collegeBrandingInputSchema;
type Field=keyof CollegeBrandingInput;
function persistedField<K extends Field>(
 key:K,value:CollegeBrandingInput[K],
):CollegeBrandingInput[K]{
 const result=shape[key].safeParse(value);
 return result.success?result.data as CollegeBrandingInput[K]:null as CollegeBrandingInput[K];
}

/** Persisted legacy bytes are not inherently safe for public login pages.
 * Never load a private object key or a signed/query-bearing image URL. */
function publicAssetUrl(value:string|null):string|null{
 const valid=persistedField("logoUrl",value);
 if(!valid)return null;
 try{
  const url=new URL(valid);
  return url.search||url.hash?null:valid;
 }catch{return null;}
}

function publicHelpUrl(value:string|null):string|null{
 const valid=persistedField("termsUrl",value);
 if(!valid)return null;
 try{
  const url=new URL(valid);
  return url.search||url.hash?null:valid;
 }catch{return null;}
}

export function sanitizePublicCollegeBranding(
 input:CollegeBrandingInput,
):CollegeBrandingInput{
 return {
  logoUrl:publicAssetUrl(input.logoUrl),
  faviconUrl:publicAssetUrl(input.faviconUrl),
  loginBackgroundUrl:publicAssetUrl(input.loginBackgroundUrl),
  loginBackgroundUrlMobile:publicAssetUrl(input.loginBackgroundUrlMobile),
  primaryColor:persistedField("primaryColor",input.primaryColor),
  secondaryColor:persistedField("secondaryColor",input.secondaryColor),
  supportEmail:persistedField("supportEmail",input.supportEmail),
  supportPhone:persistedField("supportPhone",input.supportPhone),
  termsUrl:publicHelpUrl(input.termsUrl),
  privacyUrl:publicHelpUrl(input.privacyUrl),
 };
}
