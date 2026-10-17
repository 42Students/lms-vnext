import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {emptyLearnerProfileDocument,learnerProfileDocumentSchema} from "@/modules/people/profile-validation";
import {learnerProfileChecklist} from "@/modules/people/learner-profile-checklist";
import {learnerCareerCompletionMessage} from "@/modules/people/learner-profile-career-coverage-model";
import {learnerContactEditSchema} from "@/modules/people/learner-contact-model";
import {learnerAssignmentPublishedNotice} from "@/modules/courses/learner-assignment-notification-model";
import {learnerDueSoonNotices} from "@/modules/courses/learner-assignment-due-notice-model";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("Learner Profile and Learning Round-R gap closure",()=>{
 it("LEARNER-learning-misc-R01 published grades go to persisted learner only; due reminder projection excludes submitted/deadline-less",()=>{
  const send=source("src/modules/courses/assignment-submission-service.ts");
  expect(send).toContain("COURSES_ASSIGNMENT_GRADE_PUBLISHED");
  expect(send).toContain("await tx.insert(inAppNotifications)");
  expect(send).toContain('eq(collegeMemberships.status,"ACTIVE")');
  const receipt=learnerAssignmentPublishedNotice("a","d");
  expect(receipt.title).toBe("Assignment grade published");
  expect(receipt.actionHref).toContain("/learn/allAssignments/");
  const now=new Date("2099-01-01T00:00:00Z");
  const due=new Date("2099-01-02T00:00:00Z");
  const reminders=learnerDueSoonNotices([
   {id:"a",title:"Essay",deliveryId:"d",dueAt:due,submissionId:null},
   {id:"b",title:"Submitted",deliveryId:"d",dueAt:due,submissionId:"submitted"},
   {id:"c",title:"No due date",deliveryId:"d",dueAt:null,submissionId:null}
  ],now,48);
  expect(reminders.map(r=>r.key)).toEqual(["a:d"]);
 });
 it("LEARNER-profile-misc-R01 learner notification page is reachable but the topbar drawer remains shell-owned",()=>{
  const shell=source("src/components/shell/learner-topbar-tools.tsx");
  const bell=source("src/components/shell/learner-notification-bell.tsx");
  expect(shell).toContain("<LearnerNotificationBell />");
  expect(bell).toContain('href="/learn/notifications"');
  expect(source("src/app/(authenticated)/learn/notifications/page.tsx")).toContain("LearnerNotificationsInbox");
 });
 it("LEARNER-profile-misc-R02 role, shift, city and specific role preferences have persisted schema and edit UI",()=>{
  const doc=learnerProfileDocumentSchema.parse({jobPreferences:{
   rolePreferences:["Engineer"],specificRolePreference:"Backend",
   workShiftPreference:"DAY",preferredEmploymentCity:"Hyderabad"
  }});
  expect(doc.jobPreferences.rolePreferences).toEqual(["Engineer"]);
  expect(doc.jobPreferences.workShiftPreference).toBe("DAY");
  const component=source("src/components/profile/learner-profile-workspace.tsx");
  for(const field of ["jobPrefsDraft.rolePreferences","jobPrefsDraft.specificRolePreference","jobPrefsDraft.workShiftPreference","jobPrefsDraft.preferredEmploymentCity"])
   expect(component).toContain(field);
 });
 it("LEARNER-profile-misc-R04 alternate phone validates ten-to-fifteen digits and deduplicates against primary",()=>{
  const valid=learnerContactEditSchema.safeParse({confirmed:true,contacts:{
   alternatePhone:"9876543210",contactEmail:"student@example.test"
  }});
  expect(valid.success).toBe(true);
  expect(learnerContactEditSchema.safeParse({confirmed:true,contacts:{
   alternatePhone:"123456789",contactEmail:""
  }}).success).toBe(false);
  const service=source("src/modules/people/learner-contact-service.ts");
  expect(service).toContain("ALTERNATE_PHONE_SAME_AS_PRIMARY");
  expect(service).toContain("user.phoneE164");
  expect(source("src/components/profile/learner-profile-workspace.tsx"))
   .toContain("Alternate phone number cannot be the same as primary mobile number");
 });
 it("LEARNER-profile-misc-R05 profile completion follows weighted, non-sensitive career sections with message tiers",()=>{
  const blank=learnerProfileChecklist(emptyLearnerProfileDocument);
  const hobby=learnerProfileChecklist(learnerProfileDocumentSchema.parse({hobbies:["Reading"]}));
  const personal=learnerProfileChecklist(learnerProfileDocumentSchema.parse({personalDetails:{gender:"Female"}}));
  const identity=learnerProfileChecklist(learnerProfileDocumentSchema.parse({identity:{aadhaarNumber:"123456789012"}}));
  expect(blank.percentage).toBe(0);
  expect(personal.percentage).toBeGreaterThan(hobby.percentage);
  expect(identity.percentage).toBe(blank.percentage);
  expect(learnerCareerCompletionMessage(100)).toBe("Excellent! Your profile is complete!");
  expect(source("src/components/profile/learner-profile-workspace.tsx")).toContain("learnerCareerCompletionMessage(percent)");
 });
});
