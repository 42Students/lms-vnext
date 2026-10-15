import {z} from "zod";
/** Navigates only by exact membership ID; destination performs its own authorization. */
export function collegeVerificationStudentHref(membershipId:string):string{
 return "/college/students/"+z.string().uuid().parse(membershipId);
}
