/** PDF viewer hints. This is only a browser embed URL, not PDF parsing or a
 * server-side proxy to arbitrary external files. Query tokens are preserved.
 */
export function mentorPdfEmbedUrl(
 raw:string,page:number,zoom:number,
):string|null{
 try{
  const url=new URL(raw);
  if(!["https:","http:"].includes(url.protocol)||!url.hostname||
     url.username||url.password)return null;
  const safePage=Number.isSafeInteger(page)?Math.min(999,Math.max(1,page)):1;
  const safeZoom=Number.isSafeInteger(zoom)?Math.min(200,Math.max(50,zoom)):100;
  url.hash="page="+safePage+"&zoom="+safeZoom;
  return url.toString();
 }catch{return null;}
}
