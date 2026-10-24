/** After a confirmed review, move to the next task still awaiting the
 * Mentor's decision in the CURRENT filtered Board scope. Never select an
 * already reviewed task or a filtered-out task.
 */
export function nextMentorReviewFocus(
 visible:readonly {id:string;status:string}[],reviewedId:string,
):string|null{
 const currentIndex=visible.findIndex(task=>task.id===reviewedId);
 const later=visible.slice(Math.max(0,currentIndex+1))
  .find(task=>task.status==="IN_REVIEW"&&task.id!==reviewedId);
 if(later)return later.id;
 return visible.find(task=>task.status==="IN_REVIEW"&&task.id!==reviewedId)?.id??null;
}
