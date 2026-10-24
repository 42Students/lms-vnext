/** Only browser-renderable, bounded content types are permitted for inline
 * project file previews. Office spreadsheets, executable formats and unknown
 * types stay download-only. The storage grant endpoint remains authoritative.
 */
export type MentorPrivatePreviewKind="PDF"|"IMAGE"|null;
export function mentorPrivatePreviewKind(contentType:string):MentorPrivatePreviewKind{
 const type=contentType.split(";")[0]?.trim().toLowerCase()??"";
 if(type==="application/pdf")return "PDF";
 if(["image/png","image/jpeg","image/webp","image/gif"].includes(type))return "IMAGE";
 return null;
}
export function mentorPrivatePreviewGrantValid(
 grant:{url:string;expiresAt:string},nowMs:number,
 isSafe:(value:string)=>boolean,
):boolean{
 const expiry=Date.parse(grant.expiresAt);
 return Number.isFinite(nowMs)&&Number.isFinite(expiry)&&
   expiry>nowMs+5000&&isSafe(grant.url);
}
