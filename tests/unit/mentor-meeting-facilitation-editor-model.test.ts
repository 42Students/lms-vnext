import {describe,expect,it} from "vitest";
import {mentorMeetingFacilitationSchema} from
 "@/modules/projects/mentor-meeting-facilitation-model";
import {addMentorMeetingAction,editMentorMeetingAction,
 removeMentorMeetingAction,preservesMentorMeetingFacilitationReferences,
 MENTOR_MEETING_MAX_ACTION_ITEMS} from
 "@/modules/projects/mentor-meeting-facilitation-editor-model";

const person={name:"Student A",membershipId:"11111111-1111-4111-8111-111111111111",attended:false};
const retro={text:"Fix flaky suite",owner:"Student A",dueAt:null,complete:false,
 linkedTaskId:"22222222-2222-4222-8222-222222222222",taskKey:"LEG-13"};
const before={attendees:[person],retroActions:[retro],followUpAt:null};
describe("completed-meeting inline facilitation edits",()=>{
 it("adds, updates and removes action items without altering recorded rows",()=>{
  const added=addMentorMeetingAction([]);
  expect(added).toEqual([{text:"",owner:null,dueAt:null,complete:false}]);
  const edited=editMentorMeetingAction(added,0,{
   text:"Collect tests",owner:"Student A",complete:true});
  expect(edited[0]).toMatchObject({text:"Collect tests",owner:"Student A",complete:true});
  expect(added[0]?.text).toBe("");
  expect(removeMentorMeetingAction(edited,0)).toEqual([]);
 });
 it("caps actions to the JSONB schema limit and rejects malformed saves",()=>{
  const many=Array.from({length:MENTOR_MEETING_MAX_ACTION_ITEMS},(_,index)=>({
   text:"Action "+index,owner:null,dueAt:null,complete:false,
  }));
  expect(addMentorMeetingAction(many)).toHaveLength(100);
  expect(mentorMeetingFacilitationSchema.safeParse({actionItemRows:many}).success)
   .toBe(true);
  expect(mentorMeetingFacilitationSchema.safeParse({
    actionItemRows:addMentorMeetingAction([]),
  }).success).toBe(false);
  expect(editMentorMeetingAction(many,-1,{text:"forged"})).toEqual(many);
  expect(removeMentorMeetingAction(many,101)).toEqual(many);
 });
 it("allows changing attendance outcome but not meeting attendee identities",()=>{
  expect(preservesMentorMeetingFacilitationReferences(before,{
   ...before,attendees:[{...person,attended:true}],
  })).toBe(true);
  expect(preservesMentorMeetingFacilitationReferences(before,{
   ...before,attendees:[{...person,name:"Forged student"}],
  })).toBe(false);
  expect(preservesMentorMeetingFacilitationReferences(before,{
   ...before,attendees:[],
  })).toBe(false);
  expect(preservesMentorMeetingFacilitationReferences(before,{
   ...before,attendees:[{...person,membershipId:null}],
  })).toBe(false);
 });
 it("preserves immutable retrospective task links and follow-up scheduling",()=>{
  expect(preservesMentorMeetingFacilitationReferences(before,{
   ...before,retroActions:[{...retro,linkedTaskId:null}],
  })).toBe(false);
  expect(preservesMentorMeetingFacilitationReferences(before,{
   ...before,followUpAt:"2026-10-25T10:00:00.000Z",
  })).toBe(false);
  expect(preservesMentorMeetingFacilitationReferences(before,before)).toBe(true);
 });
});
