import {isLaterMentorSprint} from "./mentor-sprint-order-model";

/**
 * Signing off and activating a later Sprint is one all-or-nothing transaction.
 * This function checks state/order; caller separately verifies project,
 * persisted Mentor, target membership, and row locks in PostgreSQL.
 */
export function mentorAtomicNextSprintEligible(input:{
  sourceSprintId:string;targetSprintId:string;
  sourceReleaseSequence:number;sourceSprintSequence:number;
  targetReleaseSequence:number;targetSprintSequence:number;
  targetSprintStatus:string;targetReleaseStatus:string;
  hasPrimaryMentor:boolean;hasAnotherActiveSprint:boolean;
}):boolean{
  return input.sourceSprintId!==input.targetSprintId &&
    input.targetSprintStatus==="PLANNED" &&
    (input.targetReleaseStatus==="PLANNED"||
     input.targetReleaseStatus==="IN_PROGRESS") &&
    input.hasPrimaryMentor && !input.hasAnotherActiveSprint &&
    isLaterMentorSprint({
      releaseSequence:input.sourceReleaseSequence,
      sprintSequence:input.sourceSprintSequence,
    },{
      releaseSequence:input.targetReleaseSequence,
      sprintSequence:input.targetSprintSequence,
    });
}
