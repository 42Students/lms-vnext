import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import MentorDeliveryVersionPage from "@/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page";
import MentorTaskFeedbackPage from "@/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page";

const state=vi.hoisted(()=>({
 reject:false,deliveryReads:0,feedbackReads:0,
 sourceUrl:null as string|null,demoUrl:null as string|null,
 attachments:[] as unknown[],writtenFeedback:null as string|null,
 feedbackRows:[] as Array<{id:string;version:number;status:string;feedback:string;reviewedAt:Date|null}>,
}));
const projectId="11111111-1111-4111-8111-111111111111";
const submissionId="22222222-2222-4222-8222-222222222222";
const taskId="33333333-3333-4333-8333-333333333333";
vi.mock("next/link",()=>({
 default:({href,children}:{href:string;children:ReactNode})=><a href={href}>{children}</a>,
}));
vi.mock("@/components/ui/page-header",()=>({
 PageHeader:({title,description,actions}:{title:string;description?:string;actions?:ReactNode})=>
  <header><h1>{title}</h1><p>{description}</p>{actions}</header>,
}));
vi.mock("@/components/ui/empty-state",()=>({
 EmptyState:({title,description}:{title:string;description:string})=>
  <section role="status"><h2>{title}</h2><p>{description}</p></section>,
}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>({user:{id:"mentor"}}),
}));
vi.mock("@/modules/projects/mentor-delivery-version-service",()=>({
 getMentorDeliveryVersion:async()=>{
  state.deliveryReads++;
  if(state.reject)throw new Error("PROJECT_ACCESS_DENIED");
  return {projectId,projectTitle:"Atlas",projectStatus:"ACTIVE",
   submittedByName:null,reviewedByName:null,createdByName:null,events:[],
   version:{id:submissionId,version:2,status:"SUBMITTED",submissionType:"FINAL",
    decisionLabel:"Awaiting review",sourceUrl:state.sourceUrl,demoUrl:state.demoUrl,
    summary:null,notes:null,feedback:state.writtenFeedback,attachments:state.attachments,
    createdAt:null,submittedAt:null,lockedAt:null,reopenedAt:null,reviewedAt:null}};
 },
}));
vi.mock("@/modules/projects/mentor-task-feedback-service",()=>({
 getMentorTaskFeedback:async()=>{
  state.feedbackReads++;
  if(state.reject)throw new Error("PROJECT_ACCESS_DENIED");
  return {projectId,task:{id:taskId,title:"Iteration review"},feedback:state.feedbackRows,
   hasCommentThread:false};
 },
}));
const renderDelivery=async()=>renderToStaticMarkup(await MentorDeliveryVersionPage({
 params:Promise.resolve({projectId,submissionId}),
}));
const renderFeedback=async()=>renderToStaticMarkup(await MentorTaskFeedbackPage({
 params:Promise.resolve({projectId,taskId}),
}));
beforeEach(()=>{
 state.reject=false;state.deliveryReads=0;state.feedbackReads=0;
 state.sourceUrl=null;state.demoUrl=null;state.attachments=[];
 state.writtenFeedback=null;state.feedbackRows=[];
});
describe("Mentor evidence view privacy and empty-state boundaries",()=>{
 it("PROJ-BREAK-MENTOR-268 empty final-delivery record never invents approval, links or history",async()=>{
  const html=await renderDelivery();
  expect(html).toContain("Delivery version 2");
  expect(html).toContain("Awaiting review");
  expect(html).toContain("No summary recorded");
  expect(html).toContain("No written reviewer feedback is recorded");
  expect(html).toContain("No valid source or demo URL");
  expect(html).toContain("No extra attachments recorded");
  expect(html).toContain("No submission history recorded");
  expect(html).not.toContain('href="javascript:');
  expect(state.deliveryReads).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-269 malicious submission URLs and credentialed links never become hyperlinks",async()=>{
  state.sourceUrl="javascript:alert(1)";
  state.demoUrl="https://user:password@example.org/demo";
  state.attachments=[
   {kind:"LINK",name:"Unsafe link",url:"data:text/html,<script>alert(1)</script>"},
   {kind:"FILE",name:"Photo",fileId:"secret-storage-key"},
  ];
  const html=await renderDelivery();
  expect(html).toContain("No valid source or demo URL");
  expect(html).toContain("Unsafe link");
  expect(html).not.toContain('href="javascript:');
  expect(html).not.toContain('href="data:');
  expect(html).not.toContain("secret-storage-key");
  expect(html).toContain("Uploaded file recorded");
 });
 it("PROJ-BREAK-MENTOR-270 safe HTTPS evidence links use noopener and explicit new-tab semantics",async()=>{
  state.sourceUrl="https://example.edu/project";
  state.attachments=[{kind:"LINK",name:"Demo recording",url:"https://example.edu/demo"}];
  const html=await renderDelivery();
  expect(html).toContain("Open source link");
  expect(html).toContain("Open link");
  expect(html).toContain('rel="noopener noreferrer"');
  expect(html).toContain('target="_blank"');
  expect(html).toContain("https://example.edu/project");
  expect(html).toContain("https://example.edu/demo");
 });
 it("PROJ-BREAK-MENTOR-271 task feedback empty state does not fabricate a discussion thread",async()=>{
  const html=await renderFeedback();
  expect(html).toContain("Conversation thread unavailable");
  expect(html).toContain("No recorded reviewer feedback");
  expect(html).not.toContain("Reply to learner");
  expect(html).toContain("Back to authorized task Board");
  expect(state.feedbackReads).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-272 persisted task feedback is escaped and has a recorded version",async()=>{
  state.feedbackRows=[{id:"review-1",version:4,status:"APPROVED",
   feedback:"<script>alert('x')</script>",reviewedAt:new Date("2026-10-18T10:00:00Z")}];
  const html=await renderFeedback();
  expect(html).toContain("Version 4");
  expect(html).toContain("Approved");
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>");
  expect(html).toContain("IST");
 });
 it("PROJ-BREAK-MENTOR-273 denial propagates with no privileged evidence fallback",async()=>{
  state.reject=true;
  await expect(renderDelivery()).rejects.toThrow("PROJECT_ACCESS_DENIED");
  await expect(renderFeedback()).rejects.toThrow("PROJECT_ACCESS_DENIED");
 });
});
