export type EditableStudentModule="projects"|"electives";
export type StudentSelection="INHERIT"|"ON"|"OFF";
export type ExpectedRule={enabled:boolean;locked:boolean}|null;
export function studentRulePayload(module:EditableStudentModule,choice:StudentSelection,locked:boolean,expected:ExpectedRule){
 return choice==="INHERIT"
  ? {action:"INHERIT" as const,module,expected}
  : {action:"SET" as const,module,enabled:choice==="ON",locked,expected};
}
export function studentRuleChangeSummary(module:EditableStudentModule,choice:StudentSelection,locked:boolean){
 const name=module==="projects"?"Projects":"Electives";
 return choice==="INHERIT" ? name+" will inherit its next applicable rule. A stored override will be removed."
  : name+" will store "+(choice==="ON"?"On":"Off")+(locked?" with a membership lock.":" without a membership lock.");
}
