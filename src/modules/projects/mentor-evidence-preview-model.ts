export type MentorEvidenceDisplayKind="DOCUMENT"|"IMAGE"|"VIDEO"|"EXTERNAL";
/** Active evidence is display-only. Do not parse uploaded office documents in
 * the browser or proxy arbitrary URLs through the application server. */
export function mentorEvidenceDisplayKind(href:string|null,mime:string):MentorEvidenceDisplayKind{
  if(!href)return "EXTERNAL";
  try{
    const url=new URL(href);
    if(!["https:","http:"].includes(url.protocol)||url.username||url.password||!url.hostname)
      return "EXTERNAL";
    const suffix=url.pathname.toLowerCase();
    const lower=mime.toLowerCase();
    if(/\.(png|jpe?g|webp|gif)$/.test(suffix)||/^image\/(png|jpeg|webp|gif)$/.test(lower))
      return "IMAGE";
    if(/\.pdf$/.test(suffix)||lower==="application/pdf")return "DOCUMENT";
    if(/\.(mp4|webm|ogg)$/.test(suffix)||/^video\/(mp4|webm|ogg)$/.test(lower))
      return "VIDEO";
    return "EXTERNAL";
  }catch{return "EXTERNAL";}
}
