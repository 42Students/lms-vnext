import {z} from "zod";
export const descendantTypes=["DEPARTMENT","PROGRAM","COHORT","SECTION"] as const;
export const academicModuleRuleInput=z.strictObject({
 scopeType:z.enum(descendantTypes),scopeId:z.uuid(),
 module:z.enum(["projects","placements","electives"]),
 action:z.enum(["SET","INHERIT"]),
 enabled:z.boolean().optional(),locked:z.boolean().optional(),
 expected:z.strictObject({enabled:z.boolean(),locked:z.boolean()}).nullable(),
}).superRefine((input,ctx)=>{
 if(input.action==="SET"&&(input.enabled===undefined||input.locked===undefined))
  ctx.addIssue({code:"custom",path:["enabled"],message:"Set requires enabled and locked values"});
 if(input.action==="INHERIT"&&(input.enabled!==undefined||input.locked!==undefined))
  ctx.addIssue({code:"custom",path:["action"],message:"Inherit must not write a value"});
});
export function descendantRuleMatches(expected:{enabled:boolean;locked:boolean}|null,current:{enabled:boolean;locked:boolean}|null){
 return expected===null?current===null:!!current&&expected.enabled===current.enabled&&expected.locked===current.locked;
}
