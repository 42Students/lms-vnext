export const PROJECT_MEMBER_ROLE_KINDS=[
  "LEARNER","MENTOR","CO_MENTOR","OBSERVER","REVIEWER","QA",
] as const;
export type ProjectMemberRoleKind=typeof PROJECT_MEMBER_ROLE_KINDS[number];
/** Do not grant mutations from the display role alone. */
export function mayMutateProjectWithRole(kind:ProjectMemberRoleKind,canMutate:boolean){
  return canMutate && (kind==="MENTOR"||kind==="CO_MENTOR");
}
