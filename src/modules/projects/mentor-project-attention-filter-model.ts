export type MentorProjectAttentionFilter = "MENTOR_REVIEW" | "MENTOR_REQUESTED" | "MENTOR_STALLED" | "MENTOR_MEETING_SOON";
const ATTENTION_KIND: Record<MentorProjectAttentionFilter,string> = { MENTOR_REVIEW:"REVIEW", MENTOR_REQUESTED:"REQUESTED", MENTOR_STALLED:"STALLED", MENTOR_MEETING_SOON:"MEETING_SOON" };
export function matchesMentorProjectAttention(filter: MentorProjectAttentionFilter | undefined, kinds: ReadonlySet<string> | undefined): boolean {
  return !filter || (kinds?.has(ATTENTION_KIND[filter]) ?? false);
}
