/**
 * SA-academics-people-62: old catalogue data may predate URL validation.
 * Never render credential-bearing or fragment-bearing links in an admin
 * preview. Match the authoring schema at the read boundary.
 */
export function safePublicCourseContentUrl(value:string|null|undefined):string|null{
 if(!value)return null;
 try{
  const url=new URL(value);
  if(url.protocol!=="https:"||url.username||url.password||url.hash)return null;
  return url.toString();
 }catch{return null;}
}
