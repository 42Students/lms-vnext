/** The visible learner assignment list uses a one-based, bounded server
 * page. Reject arrays, negatives and mixed strings instead of widening scope. */
export function learnerAssignmentListPage(raw:unknown):number|null{
 if(raw===undefined)return 1;
 if(typeof raw!=="string"||!/^[1-9][0-9]{0,4}$/.test(raw))return null;
 const page=Number(raw);
 return Number.isSafeInteger(page)&&page<=10000?page:null;
}
/** Course ID comes from the already-authorized learner overview, not URL text. */
export function learnerAssignmentListHref(page:number,selectedCourseId:string|null):string{
 const query=new URLSearchParams();
 if(selectedCourseId)query.set("course",selectedCourseId);
 if(page>1)query.set("page",String(page));
 return "/learn/allAssignments"+(query.size?"?"+query.toString():"");
}
