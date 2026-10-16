/** Legacy placement-cell bell and CRM timeline semantics for a campaign opt-out. */
export function tpoCampaignUnsubscribeEvent(name:string,leadId:string){
 const display=name.trim()||"Recruiter";
 return {
  eventType:"PLACEMENTS_RECRUITER_UNSUBSCRIBED",
  summary:display+" unsubscribed from emails",
  notification:{
   title:display+" unsubscribed",
   body:"This recruiter asked not to receive placement-cell emails.",
   actionHref:"/tpo/recruiters/"+encodeURIComponent(leadId),
  },
  timeline:"Unsubscribed from emails",
 };
}
