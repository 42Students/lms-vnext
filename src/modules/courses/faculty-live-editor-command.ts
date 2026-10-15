import {facultyLiveMutationSchema} from "./faculty-live-mutation-model";
import {authoringDueInstant} from "./faculty-authoring-datetime-model";
type Input = {
 action:"CREATE"|"EDIT"|"CANCEL";lessonId:string;
 selected:{id:string;expectedUpdatedAt:string|null}|undefined;
 title:string;meetingUrl:string;startsAt:string;endsAt:string;
};
/** Validate before prompting for irreversible scheduling or cancellation. */
export function facultyLiveEditorCommand(input:Input){
 const payload=input.action==="CANCEL"?
  {action:"CANCEL",contentId:input.selected?.id,expectedUpdatedAt:input.selected?.expectedUpdatedAt,confirm:true}:
  {...(input.action==="CREATE"?
    {action:"CREATE",lessonId:input.lessonId}:
    {action:"EDIT",contentId:input.selected?.id,expectedUpdatedAt:input.selected?.expectedUpdatedAt}),
   title:input.title,meetingUrl:input.meetingUrl,
   startsAt:authoringDueInstant(input.startsAt),
   endsAt:authoringDueInstant(input.endsAt),confirm:true};
 const parsed=facultyLiveMutationSchema.safeParse(payload);
 if(!parsed.success)throw new Error("Check the meeting title, secure HTTPS link, start/end times and selected live class.");
 return parsed.data;
}
