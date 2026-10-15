export function maySubmitAssignedProjectTask(assigneeMembershipId:string|null,actorMembershipId:string|null){
  return Boolean(assigneeMembershipId && actorMembershipId && assigneeMembershipId===actorMembershipId);
}
