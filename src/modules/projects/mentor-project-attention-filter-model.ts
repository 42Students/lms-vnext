export type MentorProjectAttentionFilter = "MENTOR_REVIEW" | "MENTOR_REQUESTED" | "MENTOR_STALLED" | "MENTOR_MEETING_SOON" | "MENTOR_ANY_ATTENTION";
const ATTENTION_KIND: Record<MentorProjectAttentionFilter,string> = { MENTOR_REVIEW:"REVIEW", MENTOR_REQUESTED:"REQUESTED", MENTOR_STALLED:"STALLED", MENTOR_MEETING_SOON:"MEETING_SOON", MENTOR_ANY_ATTENTION:"*" };
export function matchesMentorProjectAttention(filter: MentorProjectAttentionFilter | undefined, kinds: ReadonlySet<string> | undefined): boolean {
  if (!filter) return true;
  if (filter === "MENTOR_ANY_ATTENTION") return (kinds?.size ?? 0) > 0;
  return kinds?.has(ATTENTION_KIND[filter]) ?? false;
}
