import type {MentorMeetingFacilitation} from "./mentor-meeting-facilitation-model";

type ActionRow=MentorMeetingFacilitation["actionItemRows"][number];
type RecordedAttendee=MentorMeetingFacilitation["attendees"][number];

export const MENTOR_MEETING_MAX_ACTION_ITEMS=100;

export function addMentorMeetingAction(
  rows:readonly ActionRow[],
):ActionRow[]{
  if(rows.length>=MENTOR_MEETING_MAX_ACTION_ITEMS)return [...rows];
  return [...rows,{text:"",owner:null,dueAt:null,complete:false}];
}

export function editMentorMeetingAction(
  rows:readonly ActionRow[],index:number,
  patch:Partial<Pick<ActionRow,"text"|"owner"|"complete">>,
):ActionRow[]{
  if(!Number.isInteger(index)||index<0||index>=rows.length)return [...rows];
  return rows.map((row,i)=>i===index?{...row,...patch}:row);
}

export function removeMentorMeetingAction(
  rows:readonly ActionRow[],index:number,
):ActionRow[]{
  if(!Number.isInteger(index)||index<0||index>=rows.length)return [...rows];
  return rows.filter((_,i)=>i!==index);
}

/**
 * This inline endpoint may update attendance flags and notes, not who was
 * invited or historic retrospective task links. It cannot manufacture a new
 * meeting attendee from client input. The full meeting editor owns that flow.
 */
export function preservesMentorMeetingFacilitationReferences(
  before:Pick<MentorMeetingFacilitation,"attendees"|"retroActions"|"followUpAt">,
  after:Pick<MentorMeetingFacilitation,"attendees"|"retroActions"|"followUpAt">,
):boolean{
  if(before.followUpAt!==after.followUpAt ||
     before.retroActions.length!==after.retroActions.length ||
     before.attendees.length!==after.attendees.length)return false;
  if(before.retroActions.some((row,i)=>
    JSON.stringify(row)!==JSON.stringify(after.retroActions[i])))return false;
  const identities=(rows:readonly RecordedAttendee[])=>rows.map(row=>
    JSON.stringify([row.membershipId,row.name])).sort();
  const left=identities(before.attendees),right=identities(after.attendees);
  return left.every((key,i)=>key===right[i]);
}
