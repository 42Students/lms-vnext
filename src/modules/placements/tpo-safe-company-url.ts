/** Only explicit http(s) company pages can open outside the LMS.
 * Never render a javascript:, data:, username/password or protocol-relative URL. */
export function safeTpoCompanyWebsiteUrl(input:string|null|undefined):string|null {
 if(!input||input.length>2048)return null;
 const value=input.trim();
 if(!/^https?:\/\//i.test(value))return null;
 try{
  const url=new URL(value);
  if(!["http:","https:"].includes(url.protocol)||url.username||url.password||!url.hostname)return null;
  return url.href;
 }catch{return null;}
}
