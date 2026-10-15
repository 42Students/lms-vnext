/** Search only rows already authorized for the signed-in learner. */
export function searchLearnerNotices<T extends {title:string;message:string}>(rows:readonly T[],query:string):T[]{
 const term=query.trim().toLocaleLowerCase("en");
 if(!term)return [...rows];
 return rows.filter(row=>[row.title,row.message].some(x=>x.toLocaleLowerCase("en").includes(term)));
}
