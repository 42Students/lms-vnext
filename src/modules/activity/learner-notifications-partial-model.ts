export function learnerNotificationLoadStatus(input:{
 announcementsEnabled:boolean;announcementsFailed:boolean;personalReady:boolean;
}){
 if(!input.personalReady)return {state:"ERROR" as const,notice:"Personal notifications could not be loaded."};
 if(input.announcementsEnabled&&input.announcementsFailed)return {
   state:"PARTIAL" as const,
   notice:"College announcements could not be refreshed. Personal notifications below remain available.",
 };
 if(!input.announcementsEnabled)return {
   state:"DISABLED" as const,
   notice:"College announcements are unavailable until their rollout is verified.",
 };
 return {state:"READY" as const,notice:null};
}
