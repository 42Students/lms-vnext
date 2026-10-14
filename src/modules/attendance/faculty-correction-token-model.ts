/** Attendance corrections operate on the persisted last markedAt,
 * normalized to JavaScript Date's millisecond resolution. */
export function facultyAttendanceCorrectionTokenMatches(
 status:string|null,markedAt:Date|null,expectedIso:string|null|undefined,
):boolean{
 if(status!=="MARKED")return expectedIso===undefined||expectedIso===null;
 if(!markedAt||!expectedIso)return false;
 const token=new Date(expectedIso);
 return Number.isFinite(token.getTime())&&token.getTime()===markedAt.getTime();
}
export function facultyAttendanceNextMarkedAt(now:Date,previous:Date|null){
 return new Date(Math.max(now.getTime(),(previous?.getTime()??0)+1));
}
