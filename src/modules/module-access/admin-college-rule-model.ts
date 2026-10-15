import {z} from "zod";
import {OPTIONAL_MODULE_KEYS,type OptionalModuleKey} from "./service";
export const collegeFeatureModuleSchema=z.enum(OPTIONAL_MODULE_KEYS);
export const storedCollegeRuleSchema=z.strictObject({enabled:z.boolean(),locked:z.boolean()}).nullable();
export type StoredCollegeRule=z.infer<typeof storedCollegeRuleSchema>;
export type CollegeFeatureModule=OptionalModuleKey;
export const collegeRuleWriteSchema=z.discriminatedUnion("action",[
 z.strictObject({action:z.literal("SET"),module:collegeFeatureModuleSchema,enabled:z.boolean(),locked:z.boolean(),expected:storedCollegeRuleSchema}),
 z.strictObject({action:z.literal("INHERIT"),module:collegeFeatureModuleSchema,expected:storedCollegeRuleSchema}),
]);
export type CollegeRuleWrite=z.infer<typeof collegeRuleWriteSchema>;
export function collegeRuleSame(a:StoredCollegeRule,b:StoredCollegeRule){
 return a===null||b===null?a===b:a.enabled===b.enabled&&a.locked===b.locked;
}
export function collegeRuleNoChange(before:StoredCollegeRule,write:CollegeRuleWrite){
 return write.action==="INHERIT"?before===null:collegeRuleSame(before,{enabled:write.enabled,locked:write.locked});
}
export function collegeRulePreview(module:OptionalModuleKey,write:CollegeRuleWrite){
 const name=module==="projects"?"Projects":module==="placements"?"Placements":"Electives";
 return write.action==="INHERIT"?name+" will resume inheriting from the organization or global policy.":
  name+" will be stored as "+(write.enabled?"On":"Off")+(write.locked?" with a college-level lock.":" without a college-level lock.");
}
export function collegeRuleReadSnapshot(rules:readonly {module:string;enabled:boolean;locked:boolean}[]){
 return OPTIONAL_MODULE_KEYS.map(module=>{
  const stored=rules.find(r=>r.module===module);
  return {module,stored:stored?{enabled:stored.enabled,locked:stored.locked}:null};
 });
}
