import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
/** Navigates only by exact membership ID; destination performs its own authorization. */
export function collegeVerificationStudentHref(membershipId:string):string{
 return "/college/students/"+zUuid.parse(membershipId);
}
