import {describe,expect,it} from "vitest";
import {deriveMentorResourceShareProvenance as derive}
  from "@/modules/projects/mentor-resource-share-provenance-model";
const project="11111111-1111-4111-8111-111111111111";
const base={resourceId:"resource-A",userId:"author-1",displayName:"Recorded author"};
const event=(eventType:string,at:string,before:unknown,after:unknown,pid=project)=>({
 ...base,eventType,occurredAt:new Date(at),metadata:{projectId:pid,beforeJson:before,afterJson:after},
});
const draft={status:"DRAFT",visibility:"TEAM"};
const published={status:"ACTIVE",visibility:"TEAM"};
describe("Mentor resource sharing audit provenance",()=>{
 it("records the first creation share and ignores routine edits and re-shares",()=>{
  const result=derive([
   event("projects.resource.updated","2026-10-24T12:00:00.000Z",published,published),
   event("projects.resource.created","2026-10-24T10:00:00.000Z",null,published),
   event("projects.resource.updated","2026-10-24T11:00:00.000Z",draft,published),
  ],project);
  expect(result).toEqual([{...base,sharedAt:"2026-10-24T10:00:00.000Z"}]);
 });
 it("derives draft-to-team publication from the audited transition, not creation",()=>{
  const result=derive([
    event("projects.resource.created","2026-10-24T10:00:00.000Z",null,draft),
    event("projects.resource.updated","2026-10-24T10:01:00.000Z",draft,published),
  ],project);
  expect(result[0]?.sharedAt).toBe("2026-10-24T10:01:00.000Z");
 });
 it("does not claim publication for private visibility, unverifiable edits or foreign scope",()=>{
  const privateActive={status:"ACTIVE",visibility:"MENTOR_ONLY"};
  const result=derive([
    event("projects.resource.created","2026-10-24T10:00:00.000Z",null,privateActive),
    event("projects.resource.updated","2026-10-24T10:01:00.000Z",null,published),
    event("projects.resource.updated","2026-10-24T10:02:00.000Z",privateActive,published,"another-project"),
  ],project);
  expect(result[0]?.sharedAt).toBeNull();
  expect(derive([],project)).toEqual([]);
 });
 it("ignores archive events and never invents creator from an update",()=>{
  const result=derive([event("projects.resource.archived",
    "2026-10-24T10:03:00.000Z",draft,published)],project);
  expect(result).toEqual([{resourceId:base.resourceId,
    userId:null,displayName:null,sharedAt:null}]);
 });
});
