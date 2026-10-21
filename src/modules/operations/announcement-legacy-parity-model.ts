/** Raw legacy audience numbers need college/organization mapping before sending.
 * The helpers here only normalize copy and saved provenance. */
export function legacyAnnouncementTitle(source:string|null){
 return source?.trim().slice(0,255)||"Announcement";
}
export function legacyAnnouncementButton(label:string|null,url:string|null){
 if(!url)return {label:null,url:null};
 const safe=/^https:\/\/[^\s]+$/.test(url)&&url.length<=500;
 if(!safe)return {label:null,url:null};
 return {label:label?.trim().slice(0,60)||"Open",url};
}
export function legacyAnnouncementTimestamp(sourceLocal:string,zone:string){
 if(zone!=="Asia/Kolkata"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(sourceLocal))return null;
 const date=new Date(sourceLocal+"+05:30");
 return Number.isFinite(date.getTime())?date:null;
}
export function legacyAnnouncementDeleted(raw:boolean|null){
 return raw===true;
}
export function legacyAnnouncementMessage(input:string|null){
 return input?.trim()||"No message provided.";
}
