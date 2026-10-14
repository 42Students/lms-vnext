import type {LearnerInboxQuery} from "./learner-notification-inbox-model";
/** Small-screen state text is derived only from validated current filters/counts. */
export function learnerNotificationMobileFilterSummary(filters:LearnerInboxQuery,count:number){
 const choices:string[]=[];
 if(filters.category!=="all")choices.push(filters.category==="job"?"placements":filters.category);
 if(filters.unread==="unread")choices.push("unread only");
 if(filters.q.trim())choices.push("searched");
 const n=Math.max(0,Math.floor(count));
 const result=n+" matching notification"+(n===1?"":"s");
 return choices.length?result+" · "+choices.join(" · "):result+" · all categories";
}
