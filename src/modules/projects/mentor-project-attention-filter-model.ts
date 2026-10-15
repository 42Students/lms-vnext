export type MentorProjectAttentionFilter = "MENTOR_REVIEW" | "MENTOR_REQUESTED" | "MENTOR_STALLED";
const ATTENTION_KIND: Record<MentorProjectAttentionFilter,string> = { MENTOR_REVIEW:"REVIEW", MENTOR_REQUESTED:"REQUESTED", MENTOR_STALLED:"STALLED" };
export function matchesMentorProjectAttention(filter: MentorProjectAttentionFilter | undefined, kinds: ReadonlySet<string> | undefined): boolean {
  return !filter || (kinds?.has(ATTENTION_KIND[filter]) ?? false);
}
