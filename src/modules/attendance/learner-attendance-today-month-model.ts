/** Compare normalized, server-authorized academic month keys; do not guess
 * a new current month from a browser in another timezone. */
export function learnerAttendanceCanReturnToMonth(selected:string,current:string):boolean{
 const valid=(s:string)=>/^(?:19|20|21)\d{2}-(?:0[1-9]|1[0-2])$/.test(s);
 return valid(selected)&&valid(current)&&selected!==current;
}
