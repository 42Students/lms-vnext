/** Initial deep-link filters cannot select a non-member delivery or hide all after stale enrollment. */
export function learnerScheduleSelectedDeliveries(
 courses:readonly {deliveryId:string}[], initial?:readonly string[],
):string[]{
 const allowed=[...new Set(courses.map(course=>course.deliveryId))];
 if(initial===undefined)return allowed;
 if(initial.length===0)return [];
 const selected=new Set(initial);
 const retained=allowed.filter(id=>selected.has(id));
 return retained.length>0 ? retained : allowed;
}
