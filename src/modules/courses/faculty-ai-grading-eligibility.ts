/** No published/graded/file/link work may be sent through the suggestion port. */
export function facultyAiGradingEligible(row:{
 submissionType:string;textContent?:string|null;
 gradingStatus:string;gradePublished:boolean;
}):boolean{
 return row.submissionType==="TEXT"&&Boolean(row.textContent?.trim())&&
 row.gradingStatus==="NOT_GRADED"&&!row.gradePublished;
}
