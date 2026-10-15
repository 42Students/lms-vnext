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

/** Reject incomplete or ambiguous recheck responses; never interpret bad data as Inherit. */
export function parseStudentRuleRecheck(data:unknown,module:EditableStudentModule):ExpectedRule|undefined {
 if(!data||typeof data!=="object"||!("rules" in data)||!Array.isArray(data.rules))return undefined;
 const matches=data.rules.filter((row:unknown)=>row!==null&&typeof row==="object"&&"module" in row&&row.module===module);
 if(matches.length!==1)return undefined;
 const row=matches[0] as Record<string,unknown>;
 if(row.enabled===null && row.locked===false)return null;
 if(typeof row.enabled==="boolean"&&typeof row.locked==="boolean")
   return {enabled:row.enabled,locked:row.locked};
 return undefined;
}

/** A 2xx HTTP response alone is not proof that the intended rule was persisted. */
export function hasStudentRuleAcknowledgement(data:unknown,module:EditableStudentModule,choice:StudentSelection,locked:boolean):boolean {
 if(!data||typeof data!=="object"||!("rule" in data)||!data.rule||typeof data.rule!=="object")return false;
 const rule=data.rule as Record<string,unknown>;
 return rule.module===module && rule.enabled===(choice==="INHERIT"?null:choice==="ON") &&
  rule.locked===(choice==="INHERIT"?false:locked) && typeof rule.unchanged==="boolean";
}

/** Broader locks forbid writing On/Off, but clearing an old member override is allowed. */
export function canReviewStudentRule(choice:StudentSelection,ancestorLocked:boolean,pending:boolean,unchanged:boolean):boolean {
 return !pending&&!unchanged&&(!ancestorLocked||choice==="INHERIT");
}
