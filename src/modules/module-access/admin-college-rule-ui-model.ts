export type CollegeChoice="INHERIT"|"ON"|"OFF";
export type ObservedCollegeRule={enabled:boolean;locked:boolean}|null;
export type CollegeModule="projects"|"placements"|"electives";
export function collegeRulePayload(module:CollegeModule,choice:CollegeChoice,locked:boolean,expected:ObservedCollegeRule){
 return choice==="INHERIT"?{action:"INHERIT" as const,module,expected}:
  {action:"SET" as const,module,expected,enabled:choice==="ON",locked};
}
export function isCollegeRuleDirty(choice:CollegeChoice,locked:boolean,stored:ObservedCollegeRule){
 return choice==="INHERIT"?stored!==null:
  stored===null||stored.enabled!==(choice==="ON")||stored.locked!==locked;
}
export function collegeRuleReceipt(data:unknown,module:CollegeModule,choice:CollegeChoice,locked:boolean):boolean{
 if(!data||typeof data!=="object"||!("rule" in data)||!data.rule||typeof data.rule!=="object")return false;
 const rule=data.rule as Record<string,unknown>;
 return rule.module===module&&rule.enabled===(choice==="INHERIT"?null:choice==="ON")&&rule.locked===(choice==="INHERIT"?false:locked)&&typeof rule.unchanged==="boolean";
}
export function collegeRuleSelection(stored:ObservedCollegeRule):CollegeChoice{
 return stored===null?"INHERIT":stored.enabled?"ON":"OFF";
}
