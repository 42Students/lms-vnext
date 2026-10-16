import {safeNotificationActionHref} from "@/modules/activity/notification-action";
export function recruiterDecisionNoticeRows<T extends{
 id:string;title:string;body:string;createdAt:Date;readAt:Date|null;
 subjectId:string;
}>(rows:readonly T[],collegeId:string){
 const href=safeNotificationActionHref("/hr/drives?collegeId="+encodeURIComponent(collegeId)+"&view=WAITING");
 return rows.map(row=>({...row,href:href??"/hr/drives",unread:row.readAt===null}));
}
