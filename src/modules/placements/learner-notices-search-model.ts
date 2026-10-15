/** Search only already-authorized notices. Persisted sender and audience labels
 * are informational and must not be treated as a separate authorization query. */
export function searchLearnerNotices<T extends {
 title:string;message:string;senderLabel?:string|null;audienceLabel?:string|null
}>(rows:readonly T[],query:string):T[]{
 const term=query.trim().toLocaleLowerCase("en");
 if(!term)return [...rows];
 return rows.filter(row=>
  [row.title,row.message,row.senderLabel,row.audienceLabel]
   .some(value=>value?.toLocaleLowerCase("en").includes(term)??false));
}
