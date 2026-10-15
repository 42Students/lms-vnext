/** Never render an executable script/data URL or embed credentials in an
 * external course resource link. This applies to trusted but editable faculty data. */
export function learnerSafeExternalContentHref(value: string|null|undefined):string|null {
 if(!value||value.length>2048)return null;
 try{
  const parsed=new URL(value.trim());
  if(!["https:","http:"].includes(parsed.protocol))return null;
  if(!parsed.hostname||parsed.username||parsed.password)return null;
  return parsed.href;
 }catch{return null;}
}
