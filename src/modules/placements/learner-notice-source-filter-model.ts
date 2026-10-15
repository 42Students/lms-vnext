/** Filter only announcements already authorized for a college membership.
 * TPO sender metadata is not a claim of a dedicated placement announcement publisher. */
export function filterLearnerNoticesBySource<T extends {senderLabel?:string|null}>(
 rows:readonly T[],source:"all"|"placement-cell"
):T[]{
 return source==="placement-cell"?rows.filter(x=>x.senderLabel==="Placement cell"):[...rows];
}
