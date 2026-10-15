import {z} from "zod";
export const previousStudentRuleSchema=z.strictObject({enabled:z.boolean(),locked:z.boolean()}).nullable();
export type PreviousStudentRule=z.infer<typeof previousStudentRuleSchema>;
export function studentRuleMatches(expected:PreviousStudentRule,actual:PreviousStudentRule){
 if(expected===null||actual===null)return expected===actual;
 return expected.enabled===actual.enabled&&expected.locked===actual.locked;
}
