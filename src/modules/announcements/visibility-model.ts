export type AnnouncementVisibility = "LIVE" | "SCHEDULED" | "EXPIRED" | "DELETED" | "CANCELLED";
export function announcementVisibilityAt(row:{
 deletedAt:Date|null;scheduledAt:Date|null;expiresAt:Date|null;
 cancelledAt?:Date|null;status?:string|null;
},now:number):AnnouncementVisibility{
 if(row.deletedAt)return "DELETED";
 if(row.cancelledAt||row.status==="CANCELLED")return "CANCELLED";
 if(row.scheduledAt && row.scheduledAt.getTime()>now)return "SCHEDULED";
 if(row.expiresAt && row.expiresAt.getTime()<=now)return "EXPIRED";
 return "LIVE";
}

/** Admin history is not recipient delivery. Scheduled and expired notices
 * remain inspectable by the owning college admin even outside their delivery
 * window; a recipient's feed is limited to currently LIVE announcements.
 * DELETED / CANCELLED history is retained only in privileged audit views.
 */
export function announcementInReadScope(
 visibility:AnnouncementVisibility,reader:"ADMIN"|"RECIPIENT",
 includeInactive=false,
):boolean{
 if(reader==="RECIPIENT")return visibility==="LIVE";
 return includeInactive || visibility==="LIVE" ||
  visibility==="SCHEDULED" || visibility==="EXPIRED";
}
