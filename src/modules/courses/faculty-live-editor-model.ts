import {authoringLocalDateTime} from "./faculty-authoring-datetime-model";
export type FacultyLiveEditableSession = {
 id:string;title:string;startsAt:string;endsAt:string;meetingUrl:string|null;
};
export function facultyLiveEditorDraft(session:FacultyLiveEditableSession){
 return {title:session.title,meetingUrl:session.meetingUrl??"",
  startsAt:authoringLocalDateTime(session.startsAt),
  endsAt:authoringLocalDateTime(session.endsAt)};
}
