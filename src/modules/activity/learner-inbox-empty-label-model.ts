import type {LearnerNotificationCategory} from "./learner-notification-category";
/** Distinguish a genuinely empty owned inbox from a filter mismatch. */
export function learnerInboxEmptyLabel(input:{
 total:number;category:LearnerNotificationCategory;unread:"all"|"unread";search:string;
}):string{
 if(input.total===0)return "No notifications yet";
 if(input.unread==="unread"&&input.category==="all"&&!input.search.trim())return "No unread personal notifications";
 if(input.search.trim())return "No notifications match your search and filters";
 return input.category==="all"?"No notifications match these filters":
  "No "+input.category.replaceAll("_"," ").toLowerCase()+" notifications yet. Try another category or return to the complete notifications list.";
}
