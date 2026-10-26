/** Optional message drafting helpers. They never perform a send or invent
 * live placement counts; data-dependent totals must come from verified records. */
export const TPO_MESSAGE_TEMPLATE_LIBRARY=[
 {id:"thanks-noted",group:"Recent",title:"Thanks, noted",
  text:"Thank you for the update. Noted."},
 {id:"confirm-end-day",group:"Recent",title:"Will confirm by end of day",
  text:"Thank you. We will check the details and aim to confirm by the end of the day."},
 {id:"can-talk",group:"Recent",title:"Can we talk today?",
  text:"Would you be available for a brief call today? Please share a convenient time."},
 {id:"eligible-count",group:"Planning a drive",title:"Share the eligible count",
  text:"We will verify the eligible learner count against the drive criteria before sharing a confirmed total."},
 {id:"intro",group:"Reaching out",title:"Introduce the college",
  text:"Hello, we would like to introduce our placement cell and explore campus recruitment with your team. Could you share the appropriate contact for university hiring?"},
 {id:"welcome",group:"Reaching out",title:"Welcome back",
  text:"Welcome back! We would be glad to discuss another campus recruitment opportunity with your team."},
 {id:"season",group:"Reaching out",title:"Season dates",
  text:"We are planning the placement season. Could you share your preferred recruitment weeks so we can coordinate campus dates?"},
 {id:"results",group:"Planning a drive",title:"Results and next steps",
  text:"Thank you for sharing the drive results. Could you confirm the next steps and the expected timeline for formal offers?"},
 {id:"slots",group:"Planning a drive",title:"Interview slots",
  text:"Could you confirm the interview dates, slot durations and any special requirements before we notify students?"},
] as const;
export type TpoMessageTemplate=(typeof TPO_MESSAGE_TEMPLATE_LIBRARY)[number];
export function searchTpoMessageTemplates(query:string){
 const needle=query.trim().toLocaleLowerCase("en");
 return TPO_MESSAGE_TEMPLATE_LIBRARY.filter(item=>!needle||
  [item.group,item.title,item.text].some(value=>value.toLocaleLowerCase("en").includes(needle)));
}
