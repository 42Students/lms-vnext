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
 action:"GRADE"|"PUBLISH",maximum:number){
 const parsed=receipt.safeParse(raw);
 if(!parsed.success)throw new FacultyManualGradeReceiptError();
 const result=parsed.data.submission;
 if(result.id!==current.id||result.assignmentId!==current.assignmentId||
 result.deliveryId!==current.deliveryId||result.membershipId!==current.membershipId||
 !Number.isSafeInteger(result.version)||result.version!==current.version+1||
 result.gradingStatus!=="GRADED"||result.pointsAwarded===null||
 result.pointsAwarded>maximum||result.gradePublished!==(action==="PUBLISH"))
 throw new FacultyManualGradeReceiptError();
 return result;
}
