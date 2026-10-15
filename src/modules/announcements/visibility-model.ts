export type AnnouncementVisibility = "LIVE" | "SCHEDULED" | "EXPIRED" | "DELETED";
export function announcementVisibilityAt(row:{
 deletedAt:Date|null;scheduledAt:Date|null;expiresAt:Date|null;
},now:number):AnnouncementVisibility{
 if(row.deletedAt)return "DELETED";
 if(row.scheduledAt && row.scheduledAt.getTime()>now)return "SCHEDULED";
 if(row.expiresAt && row.expiresAt.getTime()<=now)return "EXPIRED";
 return "LIVE";
}
