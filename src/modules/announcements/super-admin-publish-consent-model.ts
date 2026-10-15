import {AnnouncementError} from "./errors";
/** Only Super Admin publication requires an explicit user-reviewed consent acknowledgement. */
export function requirePlatformPublishConsent(superAdmin:boolean,approved:boolean){
 if(superAdmin&&!approved)throw new AnnouncementError("CONSENT_REQUIRED");
}
export function platformAnnouncementPublicationSummary(input:{
 receiverType:string;receiverLabel:string;title:string;scheduledAt:string|null;expiresAt:string|null;isPinned:boolean;
}){
 return [
  "Audience: "+input.receiverType+" · "+input.receiverLabel,
  "Title: "+input.title.trim(),
  input.scheduledAt?"Scheduled publication: "+input.scheduledAt:"Publication: immediately after confirmation",
  input.expiresAt?"Expiry: "+input.expiresAt:"Expiry: none",
  "Pinned: "+(input.isPinned?"Yes":"No"),
 ];
}
