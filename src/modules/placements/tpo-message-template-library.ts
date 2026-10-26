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
 // Reviewed against old LMS TpoTemplateService BUILT_IN MESSAGE entries.
 // No live counts, dates, venues or other recruiter facts are guessed here.
 {id:"hello",group:"Reaching out",title:"Hello",
  text:"Hello, thank you for joining. Please let us know how the placement cell can support your campus recruitment plans."},
 {id:"call",group:"Reaching out",title:"Can we talk?",
  text:"Could we have a short call today to discuss your campus hiring requirements? Please suggest a convenient time."},
 {id:"job-description",group:"Planning a drive",title:"Ask for the JD",
  text:"Could you share the job description, package details and eligibility requirements? We will verify them before publishing to learners."},
 {id:"confirm-dates",group:"Planning a drive",title:"Confirm the dates",
  text:"Could you confirm the application deadline, round dates and venues? We will verify the latest drive schedule before notifying learners."},
 {id:"who-can-apply",group:"Planning a drive",title:"Who can apply",
  text:"We will verify the eligible applicant count against the saved drive criteria and share the list when applications close."},
 {id:"venue-timing",group:"During a drive",title:"Venue and timings",
  text:"Could you confirm the round time and venue? We will send final reporting instructions once the schedule is verified."},
 {id:"share-shortlist",group:"During a drive",title:"Share the shortlist",
  text:"Could you share the shortlist for the current drive and confirm when shortlisted students should report for the next round?"},
 {id:"panel-details",group:"During a drive",title:"Panel details",
  text:"How many panel members should we expect? Please share any room, network or equipment requirements."},
 {id:"results-date",group:"Results",title:"When will results come?",
  text:"Could you confirm when the current round results will be available? We will update students after receiving the official outcome."},
 {id:"offers",group:"Results",title:"Ask for the offers",
  text:"Thank you for sharing the results. Could you send the formal offer letters and next-step instructions for the selected students?"},
 {id:"updated-list",group:"Follow-ups",title:"Please share the updated list",
  text:"Could you share the latest finalized list so that we can reconcile the current drive records?"},
 {id:"thank-you",group:"Follow-ups",title:"Thank you",
  text:"Thank you for working with our placement cell. We appreciate your team's time and support."},
] as const;
export type TpoMessageTemplate=(typeof TPO_MESSAGE_TEMPLATE_LIBRARY)[number];
export function searchTpoMessageTemplates(query:string){
 const needle=query.trim().toLocaleLowerCase("en");
 return TPO_MESSAGE_TEMPLATE_LIBRARY.filter(item=>!needle||
  [item.group,item.title,item.text].some(value=>value.toLocaleLowerCase("en").includes(needle)));
}
