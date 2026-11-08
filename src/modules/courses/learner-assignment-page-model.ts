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

/** Preserve only the canonical course/page selectors when an old learner bookmark
 * uses /learn/assignments. Repeated, forged or malformed inputs must lead to a
 * recoverable invalid-link state, never silently change the requested course. */
export function learnerAssignmentsLegacyAliasHref(query: {course?:unknown;page?:unknown}): string | null {
 const page=learnerAssignmentListPage(query.page);
 if(page===null)return null;
 const course=query.course;
 if(course!==undefined && (typeof course!=="string" ||
   !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(course)))return null;
 return learnerAssignmentListHref(page,typeof course==="string"?course:null);
}

/** A deleted/filtered result can leave a learner on a page that no longer
 * exists. Recover only after the authorized overview supplies a count; never
 * derive course or membership scope from raw URL input. */
export function learnerAssignmentListRecoveryPage(page:number,total:number,pageSize=20):number|null{
 if(!Number.isSafeInteger(page)||page<1||!Number.isSafeInteger(total)||total<0||
    !Number.isSafeInteger(pageSize)||pageSize<1)return null;
 const last=Math.max(1,Math.ceil(total/pageSize));
 return page>last?last:null;
}
