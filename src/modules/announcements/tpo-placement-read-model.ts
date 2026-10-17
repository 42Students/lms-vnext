import {z} from "zod";
export const tpoAnnouncementTabSchema=z.enum(["yours","from-42","deleted"]);
export function senderTypeForTpoTab(tab:z.infer<typeof tpoAnnouncementTabSchema>){
 return tab==="from-42"?"SUPER_ADMIN" as const:"TPO" as const;
}
export function projectTpoAnnouncementRows(rows:readonly {
 id:string;title:string;message:string;isPinned:boolean;createdAt:Date;scheduledAt:Date|null;expiresAt:Date|null;
 version:number;deletedAt:Date|null;senderUserId:string;senderName:string|null;updatedAt:Date;
}[]) {return rows.map(row=>({
 id:row.id,title:row.title,message:row.message,isPinned:row.isPinned,
 createdAt:row.createdAt,scheduledAt:row.scheduledAt,expiresAt:row.expiresAt,
 version:row.version,deletedAt:row.deletedAt,senderUserId:row.senderUserId,
 senderName:row.senderName,updatedAt:row.updatedAt,
}));}
