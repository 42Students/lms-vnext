export const MENTOR_PORTFOLIO_SEGMENTS=[
  "CURRENT","NEEDS_YOU","AT_RISK","FINAL_SUBMISSION","ARCHIVED",
] as const;
export type MentorPortfolioSegment=typeof MENTOR_PORTFOLIO_SEGMENTS[number];

export type MentorPortfolioSegmentFacts={
  status:string;
  blocker:string|null;
  attentionKinds:ReadonlySet<string>|undefined;
  /** At least one non-deleted final-delivery draft or submission is recorded. */
  hasFinalSubmission:boolean;
  /** True only when actual non-deleted releases/sprints have all shipped/signed off. */
  planFullyDelivered:boolean;
};

const actionKinds=new Set([
  "REVIEW","TASK_REVIEW","TASK_BLOCKED","SPRINT_SIGN_OFF",
  "REQUESTED","UNASSIGNED_NEXT",
]);

/** Status pills are an exact-project filter over already authorized Mentor
 * assignments. Archived work stays separate, and `meeting soon` alone is
 * not a request for a Mentor decision. Missing history is never treated as
 * fully delivered.
 */
export function matchesMentorPortfolioSegment(
  selected:MentorPortfolioSegment|undefined,
  facts:MentorPortfolioSegmentFacts,
):boolean{
  if(!selected)return true;
  if(selected==="ARCHIVED")return facts.status==="ARCHIVED";
  if(facts.status==="ARCHIVED")return false;
  switch(selected){
    case "CURRENT":return true;
    case "NEEDS_YOU":return [...(facts.attentionKinds??[])].some(kind=>
      actionKinds.has(kind));
    case "AT_RISK":return Boolean(facts.blocker?.trim())||
      facts.attentionKinds?.has("STALLED")===true||
      facts.attentionKinds?.has("TASK_BLOCKED")===true;
    case "FINAL_SUBMISSION":return facts.hasFinalSubmission||facts.planFullyDelivered;
  }
}

/** Changing a segment deliberately resets pagination and conflicting
 * status/attention filters, while preserving independent search and sort.
 */
export function mentorPortfolioSegmentHref(
  segment:MentorPortfolioSegment|undefined,
  state:{
    search?:string;assignment?:string;work?:string;sort?:string;
    pageSize?:number;
  },
):string{
  const query=new URLSearchParams();
  if(segment)query.set("segment",segment);
  if(state.search)query.set("search",state.search);
  if(state.assignment)query.set("assignment",state.assignment);
  if(state.work)query.set("work",state.work);
  if(state.sort&&state.sort!=="RECENT")query.set("sort",state.sort);
  if(state.pageSize&&state.pageSize!==25)query.set("pageSize",String(state.pageSize));
  return "/mentor/projects"+(query.size?"?"+query.toString():"");
}
