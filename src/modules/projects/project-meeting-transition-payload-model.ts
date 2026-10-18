type ProjectMeetingTransitionAction="COMPLETE"|"CANCEL";
type ProjectMeetingActorMode="LEARNER"|"MENTOR"|"ADMIN";

/**
 * Pin the meeting revision shown on the page for every account, not only the
 * newer Mentor decision endpoint. The server also enforces this version at
 * the transactional compare-and-swap boundary.
 */
export function projectMeetingTransitionPayload(
 action:ProjectMeetingTransitionAction,
 mode:ProjectMeetingActorMode,
 updatedAt:Date|string,
 note:string,
){
 const expectedUpdatedAt=new Date(updatedAt).toISOString();
 const confirmed=mode==="MENTOR"?{confirmed:true as const}:{};
 if(action==="COMPLETE")return {
  action,expectedUpdatedAt,...confirmed,outcome:note.trim()||undefined,
 };
 return {
  action,expectedUpdatedAt,...confirmed,note:note.trim()||undefined,
 };
}
