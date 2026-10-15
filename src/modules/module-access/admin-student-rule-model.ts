import {z} from "zod";
export const previousStudentRuleSchema=z.strictObject({enabled:z.boolean(),locked:z.boolean()}).nullable();
export type PreviousStudentRule=z.infer<typeof previousStudentRuleSchema>;
export function studentRuleMatches(expected:PreviousStudentRule,actual:PreviousStudentRule){
 if(expected===null||actual===null)return expected===actual;
 return expected.enabled===actual.enabled&&expected.locked===actual.locked;
}

export function isStudentRuleNoop(current:PreviousStudentRule,action:
 {action:"SET";enabled:boolean;locked:boolean}|{action:"INHERIT"}){
 return action.action==="INHERIT"?current===null:
  current!==null&&current.enabled===action.enabled&&current.locked===action.locked;
}

export function hasPersistedAncestorLock(rows:readonly {locked:boolean}[]):boolean{
 return rows.some(row=>row.locked);
}
