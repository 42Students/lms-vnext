/** Legacy placement-cell bell and CRM timeline semantics for a campaign opt-out. */
export function tpoCampaignUnsubscribeEvent(name:string,leadId:string){
 // Untrusted CRM names cannot inject newlines into notifications or audit events.
 // Preserve the exact legacy sentence for every normal display name.
 const display=name.replace(/[\u0000-\u001f\u007f-\u009f]/g," ")
  .replace(/\s+/g," ").trim().slice(0,120)||"Recruiter";
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
