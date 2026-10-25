import {z} from "zod";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {MentorProjectEmailKind} from "./mentor-project-email-provider";

const uuid=z.uuid();
/** Only persisted delivery submission and genuine learner meeting-request
 * events can produce a Mentor email. Decision/plan edits are not requests.
 */
export function classifyMentorProjectEmailSource(event:{
 eventType:string;subjectType:string;subjectId:string;
 metadata:Record<string,unknown>;
}):{kind:MentorProjectEmailKind;projectId:string}|null{
 const projectId=event.metadata["projectId"];
 if(typeof projectId!=="string"||!uuid.safeParse(projectId).success||
    !uuid.safeParse(event.subjectId).success)return null;
 if(event.eventType===ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_SUBMITTED&&
    event.subjectType==="project_submission")
  return {kind:"FINAL_SUBMISSION",projectId};
 if(event.eventType===ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_DECIDED&&
    event.subjectType==="project_meeting"&&event.metadata["status"]==="REQUESTED")
  return {kind:"MEETING_REQUEST",projectId};
 return null;
}

/** A queued email must not outlive the actual submitted record. Accepted
 * or review-requested submissions remain historical submissions; deleted
 * records, rolled-back drafts and impossible missing submit timestamps do not.
 */
export function mentorProjectEmailSubmissionIsNotifiable(row:{
 status:string;deletedAt:Date|null;submittedAt:Date|null;
}|null):boolean{
 return Boolean(row&&!row.deletedAt&&row.submittedAt&&
   ["SUBMITTED","CHANGES_REQUESTED","APPROVED"].includes(row.status));
}
