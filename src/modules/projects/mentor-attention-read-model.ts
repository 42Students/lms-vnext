import type {MentorProjectAttention} from "./mentor-attention";

/** Stable source/version identity for a recipient-specific read receipt.
 * A new task set revision naturally re-opens a previously acknowledged alert.
 */
export function mentorAttentionReceiptKey(
 alert:Pick<MentorProjectAttention,"projectId"|"key"|"occurredAt"|"revision">,
):string{
 return "attention:"+alert.projectId+":"+alert.key+"@"+
  (alert.revision??alert.occurredAt);
}
export function mentorAnnouncementReceiptKey(
 notice:{id:string;createdAt:Date|string},
):string{
 const stamp=new Date(notice.createdAt);
 return "announcement:"+notice.id+"@"+stamp.toISOString();
}
export function mentorUnreadAttentionCount(
 alerts:readonly MentorProjectAttention[],
 notices:readonly {id:string;createdAt:Date|string}[],
 acknowledged:ReadonlySet<string>,
):number{
 return alerts.filter(alert=>!acknowledged.has(mentorAttentionReceiptKey(alert))).length+
  notices.filter(notice=>!acknowledged.has(mentorAnnouncementReceiptKey(notice))).length;
}
