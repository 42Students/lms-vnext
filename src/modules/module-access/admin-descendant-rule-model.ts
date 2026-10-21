import {z} from "zod";
export const descendantTypes=["DEPARTMENT","PROGRAM","COHORT","SECTION"] as const;
export const academicModuleRuleInput=z.strictObject({
 scopeType:z.enum(descendantTypes),scopeId:z.uuid(),
 module:z.enum(["projects","placements","electives"]),
 action:z.enum(["SET","INHERIT"]),
 enabled:z.boolean().optional(),locked:z.boolean().optional(),
 expected:z.strictObject({enabled:z.boolean(),locked:z.boolean()}).nullable(),
}).superRefine((input,ctx)=>{
 if(input.module==="placements"&&input.action==="SET")
  ctx.addIssue({code:"custom",path:["module"],message:"Placements is managed at college level. Use Placement eligibility for learner exceptions."});
 if(input.action==="SET"&&(input.enabled===undefined||input.locked===undefined))
  ctx.addIssue({code:"custom",path:["enabled"],message:"Set requires enabled and locked values"});
 if(input.action==="INHERIT"&&(input.enabled!==undefined||input.locked!==undefined))
  ctx.addIssue({code:"custom",path:["action"],message:"Inherit must not write a value"});
});
export function descendantRuleMatches(expected:{enabled:boolean;locked:boolean}|null,current:{enabled:boolean;locked:boolean}|null){
 return expected===null?current===null:!!current&&expected.enabled===current.enabled&&expected.locked===current.locked;
}

export function academicScopeStudents(rows:readonly {scopeType:string;scopeId:string;studentsInScope:number}[]){
 return new Map(rows.map(row=>[row.scopeType+":"+row.scopeId,row.studentsInScope]));
}
