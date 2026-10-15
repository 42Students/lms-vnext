import {z} from "zod";
export const tpoAnnouncementTabSchema=z.enum(["yours","from-42"]);
export function senderTypeForTpoTab(tab:z.infer<typeof tpoAnnouncementTabSchema>){
 return tab==="from-42"?"SUPER_ADMIN" as const:"TPO" as const;
}
export function projectTpoAnnouncementRows(rows:readonly {
 id:string;title:string;message:string;isPinned:boolean;createdAt:Date;expiresAt:Date|null;
}[]) {return rows.map(row=>({
 id:row.id,title:row.title,message:row.message,isPinned:row.isPinned,
 createdAt:row.createdAt,expiresAt:row.expiresAt,
}));}
