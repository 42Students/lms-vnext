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
