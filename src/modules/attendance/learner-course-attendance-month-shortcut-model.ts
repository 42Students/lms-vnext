/** Return only to a validated server-derived IST current academic month. */
export function learnerCourseAttendanceMonthShortcutVisible(selected:string,current:string):boolean{
 const valid=(key:string)=>/^(?:19|20|21)\d{2}-(?:0[1-9]|1[0-2])$/.test(key);
 return valid(selected)&&valid(current)&&selected!==current;
}
