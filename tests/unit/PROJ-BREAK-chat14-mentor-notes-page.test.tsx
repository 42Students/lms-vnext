import {describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import MentorMeetingNotesPage from "@/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/page";

const state=vi.hoisted(()=>({
 projectStatus:"ACTIVE",meetingStatus:"COMPLETED",outcome:"Prior meeting decision" as string|null,
 reject:false,receivedProjectId:"",receivedMeetingId:"",
}));
vi.mock("next/link",()=>({
 default:({href,children,className}:{href:string;children:ReactNode;className?:string})=>
  <a href={href} className={className}>{children}</a>,
}));
vi.mock("@/components/ui/page-header",()=>({
 PageHeader:({title,description,actions}:{title:string;description:string;actions:ReactNode})=>
  <header><h1>{title}</h1><p>{description}</p>{actions}</header>,
}));
vi.mock("@/components/projects/mentor-meeting-notes-editor",()=>({
 MentorMeetingNotesEditor:({projectId,meetingId}:{projectId:string;meetingId:string})=>
  <form data-editor-for={projectId+":"+meetingId}><label>Meeting outcome<input/></label></form>,
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:async()=>({user:{id:"mentor"}})}));
vi.mock("@/modules/projects/mentor-meeting-notes-service",()=>({
 getMentorMeetingNotes:async(_:unknown,params:{projectId:string;meetingId:string})=>{
  state.receivedProjectId=params.projectId;state.receivedMeetingId=params.meetingId;
  if(state.reject)throw new Error("PROJECT_MEETING_ACCESS_DENIED");
  return {projectTitle:"Atlas",projectStatus:state.projectStatus,meeting:{
   id:params.meetingId,title:"Sprint checkpoint",status:state.meetingStatus,
   startsAt:new Date("2026-10-18T10:00:00.000Z"),endsAt:new Date("2026-10-18T10:30:00.000Z"),
   timeZone:"Asia/Kolkata",updatedAt:new Date("2026-10-18T10:35:00.000Z"),outcome:state.outcome,
  }};
 },
}));

const projectId="11111111-1111-4111-8111-111111111111";
const meetingId="22222222-2222-4222-8222-222222222222";
async function renderPage(){
 return renderToStaticMarkup(await MentorMeetingNotesPage({
  params:Promise.resolve({projectId,meetingId}),
 }));
}

describe("PROJ-BREAK-MENTOR page-level rendered meeting notes access matrix",()=>{
 it("PROJ-BREAK-MENTOR-13 only shows the live edit form to an ACTIVE project with COMPLETED meeting",async()=>{
  for(const projectStatus of ["PLANNED","ACTIVE","COMPLETED","ARCHIVED"]){
   for(const meetingStatus of ["REQUESTED","SCHEDULED","RESCHEDULED","COMPLETED","CANCELLED"]){
    state.projectStatus=projectStatus;state.meetingStatus=meetingStatus;state.outcome="Past note";
    const html=await renderPage();
    const editable=projectStatus==="ACTIVE"&&meetingStatus==="COMPLETED";
    expect(html.includes("data-editor-for="),projectStatus+" "+meetingStatus).toBe(editable);
    expect(html).toContain("Past note");
    expect(html).toContain("Meeting history");
    expect(html).toContain("Sprint checkpoint");
    expect(html).toContain("IST");
    expect(state.receivedProjectId).toBe(projectId);
    expect(state.receivedMeetingId).toBe(meetingId);
    if(!editable)expect(html).toContain("Only completed meetings in active projects");
   }
  }
 });
 it("PROJ-BREAK-MENTOR-14 no recorded notes yields an honest empty state",async()=>{
  state.projectStatus="ACTIVE";state.meetingStatus="COMPLETED";state.outcome=null;
  const html=await renderPage();
  expect(html).toContain("No written outcome is recorded.");
  expect(html).toContain("data-editor-for=");
  expect(html).not.toContain("Past note");
 });
 it("PROJ-BREAK-MENTOR-15 denied meeting does not render stale privileged content",async()=>{
  state.reject=true;
  await expect(renderPage()).rejects.toThrow("PROJECT_MEETING_ACCESS_DENIED");
  state.reject=false;
 });
});
