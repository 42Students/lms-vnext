export type TemplateAssignmentReadScope = { collegeId?: string | null; organizationId?: string | null } | null;
export function templateAssignmentMatchesScope(row:{collegeId:string;organizationId:string},scope:TemplateAssignmentReadScope) {
 return (!scope?.collegeId || scope.collegeId===row.collegeId) &&
  (!scope?.organizationId || scope.organizationId===row.organizationId);
}
export function templateAssignmentScopeLabel(scope:TemplateAssignmentReadScope) {
 return scope?.collegeId?"selected college":scope?.organizationId?"selected organization":"global";
}
