/** Search only already-authorized notices. Persisted sender and audience labels
 * are informational and must not be treated as a separate authorization query. */
export function searchLearnerNotices<T extends {
 title:string;message:string;senderLabel?:string|null;audienceLabel?:string|null
}>(rows:readonly T[],query:string):T[]{
 const normalize=(text:string)=>text.trim().replace(/\s+/gu," ").toLocaleLowerCase("en");
 const term=normalize(query);
 if(!term)return [...rows];
 return rows.filter(row=>
  [row.title,row.message,row.senderLabel,row.audienceLabel]
   .some(value=>value!==undefined&&value!==null&&normalize(value).includes(term)));
}
