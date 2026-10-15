import {z} from "zod";
const gradeRow=z.object({
 id:z.string().uuid(),assignmentId:z.string().uuid(),
 deliveryId:z.string().uuid(),membershipId:z.string().uuid(),
 version:z.number().int().min(0),pointsAwarded:z.number().int().min(0).nullable(),
 feedback:z.string().max(10000).nullable(),gradingStatus:z.enum(["NOT_GRADED","GRADED"]),
 gradePublished:z.boolean(),
}).passthrough();
const receipt=z.object({submission:gradeRow}).passthrough();
export class FacultyManualGradeReceiptError extends Error {
 constructor(){super("GRADE_RECEIPT_UNVERIFIED");}
}
export type FacultyGradeReceiptScope={
 id:string;assignmentId:string;deliveryId:string;membershipId:string;version:number;
};
export function facultyManualGradeReceipt(raw:unknown,current:FacultyGradeReceiptScope,
 action:"GRADE"|"PUBLISH",maximum:number,expectedGrade?:{points:number;feedback:string|null}){
 const parsed=receipt.safeParse(raw);
 if(!parsed.success)throw new FacultyManualGradeReceiptError();
 const result=parsed.data.submission;
 if(result.id!==current.id||result.assignmentId!==current.assignmentId||
 result.deliveryId!==current.deliveryId||result.membershipId!==current.membershipId||
 !Number.isSafeInteger(result.version)||result.version!==current.version+1||
 result.gradingStatus!=="GRADED"||result.pointsAwarded===null||
 result.pointsAwarded>maximum||result.gradePublished!==(action==="PUBLISH"))
 throw new FacultyManualGradeReceiptError();
 if(expectedGrade && (result.pointsAwarded!==expectedGrade.points||
   (result.feedback??null)!==(expectedGrade.feedback??null)))
  throw new FacultyManualGradeReceiptError();
 return result;
}

/** One in-flight write per learner submission; avoids concurrent stale token reuse. */
export function beginFacultyManualGradeOperation(lock:{current:boolean}):boolean{
 if(lock.current)return false;
 lock.current=true;return true;
}

/** Timeout or invalid success receipt cannot prove a grade was rolled back. */
export function facultyManualGradeUncertainMessage(kind:"GRADE"|"PUBLISH"):string{
 return kind==="GRADE"
  ?"The save could not be verified. It may have succeeded. Refresh current submissions before retrying."
  :"Publication could not be verified. The learner may already see the grade. Refresh before retrying.";
}
