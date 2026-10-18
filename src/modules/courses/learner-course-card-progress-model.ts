/** Progress cards require an actual published/tracked denominator.
 * Do not render NaN or out-of-bound values as accessible progress. */
export function learnerCourseCardProgress(value:number|null,itemsTotal:number):number|null{
 if(!Number.isFinite(itemsTotal)||itemsTotal<=0||value===null||!Number.isFinite(value))return null;
 return Math.max(0,Math.min(100,value));
}
