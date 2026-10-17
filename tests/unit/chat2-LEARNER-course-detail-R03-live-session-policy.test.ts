import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {learnerVisibleContentExternalUrl} from "@/modules/courses/learner-live-link-availability-model";

const read=(path:string)=>readFileSync(path,"utf8");
const href="https://meet.example.edu/session?id=learner-course-detail-r03";
const states=["SCHEDULED","AVAILABLE","ENDED"] as const;

describe("LEARNER-course-detail-R03 — scheduled live class Join/Copy",()=>{
 it("LEARNER-course-detail-R03 keeps an authorized future live meeting link before the scheduled start",()=>{
  expect(learnerVisibleContentExternalUrl({contentType:"LIVE_CLASS",availability:"SCHEDULED",externalUrl:href})).toBe(href);
  expect(learnerVisibleContentExternalUrl({contentType:"LIVE_CLASS",availability:"AVAILABLE",externalUrl:href})).toBe(href);
  expect(learnerVisibleContentExternalUrl({contentType:"LIVE_CLASS",availability:"SCHEDULED",externalUrl:null})).toBeNull();
 });
 it("LEARNER-course-detail-R03 stops exposing ended links and never widens scheduled non-live content",()=>{
  expect(learnerVisibleContentExternalUrl({contentType:"LIVE_CLASS",availability:"ENDED",externalUrl:href})).toBeNull();
  for(const type of ["VIDEO","YOUTUBE","RESOURCE","TEXT"]){
   expect(learnerVisibleContentExternalUrl({contentType:type,availability:"SCHEDULED",externalUrl:href})).toBeNull();
   expect(learnerVisibleContentExternalUrl({contentType:type,availability:"AVAILABLE",externalUrl:href})).toBe(href);
  }
  expect(learnerVisibleContentExternalUrl({contentType:"RESOURCE",availability:"ENDED",externalUrl:href})).toBeNull();
 });
 it("LEARNER-course-detail-R03 applies release policy inside the learner authorization and availability boundary",()=>{
  const service=read("src/modules/courses/learner-course-service.ts");
  expect(service).toContain('contentType: row.contentType!');
  expect(service).toContain("learnerVisibleContentExternalUrl({");
  expect(service).toContain("externalUrl: row.contentExternalUrl,");
  expect(service).toContain('row.contentType === "LIVE_CLASS"');
  expect(service).toContain("row.contentEndsAt.getTime() <= now");
  expect(service).toContain('storageKey:\n        contentAvailability === "AVAILABLE"');
  expect(service).toContain("requireLearnerMembership(");
 });
 it("LEARNER-course-detail-R03 exposes both scheduled Join and Copy only for a safe meeting URL, with accurate status",()=>{
  const workspace=read("src/components/courses/learner-course-workspace.tsx");
  expect(workspace).toContain("content.type===\"LIVE_CLASS\"&&learnerSafeExternalContentHref(content.externalUrl)");
  expect(workspace).toContain("Live session starts ");
  expect(workspace).toContain("Join and Copy are available now");
  expect(workspace).toContain("This live session has ended.");
  expect(workspace).toContain("endsAt={content.endsAt?new Date(content.endsAt).toISOString():null}");
  const control=read("src/components/courses/learner-live-class-link.tsx");
  expect(control).toContain("Join Meeting");
  expect(control).toContain("Copy meeting link");
  expect(control).toContain("navigator.clipboard.writeText(href)");
  expect(control).toContain("window.setInterval(refresh,15000)");
  expect(control).toContain("if(ended)return");
 });
});
