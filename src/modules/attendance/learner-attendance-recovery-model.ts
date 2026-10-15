/** Estimate only using marked sessions; future/unmarked meetings are not denominators yet. */
export function learnerAttendanceRecoveryProjection(
 marked:number,present:number,threshold:number,
):number|null{
 if(!Number.isInteger(marked)||marked<1||!Number.isInteger(present)||
    present<0||present>marked||!Number.isFinite(threshold)||threshold<=0||threshold>100)return null;
 if(100*present>=threshold*marked)return 0;
 if(threshold===100)return Infinity;
 return Math.max(0,Math.ceil((threshold*marked-100*present)/(100-threshold)));
}
