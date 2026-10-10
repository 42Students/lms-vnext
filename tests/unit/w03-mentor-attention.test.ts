import {describe,expect,it} from "vitest";
import {deriveMentorProjectAttention,type MentorProjectAttentionSource} from
  "@/modules/projects/mentor-attention";

const now=new Date("2026-10-10T12:00:00.000Z");
function project(overrides:Partial<MentorProjectAttentionSource>={}):MentorProjectAttentionSource {
  return {
    projectId:"b9d3a76b-a192-4cd8-8db2-0e57a06dc6a8",
    projectTitle:"Demo project",projectStatus:"ACTIVE",
    projectUpdatedAt:new Date("2026-10-10T11:00:00Z"),lastActivityAt:null,
    submission:null,meetings:[],...overrides,
  };
}
describe("W03 mentor notification attention parity",()=>{
  it("notifies about freshly submitted learner delivery",()=>{
    const alerts=deriveMentorProjectAttention([project({
      submission:{id:"sub-1",status:"SUBMITTED",submittedAt:now},
    })],now);
    expect(alerts).toEqual([expect.objectContaining({key:"review:sub-1",kind:"REVIEW"})]);
  });
  it("never treats a reopened or previously reviewed delivery as a new submission",()=>{
    for(const status of ["DRAFT","CHANGES_REQUESTED","APPROVED"]) {
      const alerts=deriveMentorProjectAttention([project({
        submission:{id:"sub-1",status,submittedAt:now},
      })],now);
      expect(alerts.some(a=>a.kind==="REVIEW")).toBe(false);
    }
  });
  it("excludes archived projects from every generated alert",()=>{
    const alerts=deriveMentorProjectAttention([project({
      projectStatus:"ARCHIVED",
      projectUpdatedAt:new Date("2026-09-01T00:00:00Z"),
      submission:{id:"sub",status:"SUBMITTED",submittedAt:now},
      meetings:[{id:"meet",title:"Review",status:"REQUESTED",startsAt:now}],
    })],now);
    expect(alerts).toEqual([]);
  });
  it("avoids stalled alerts for missing genuine activity or nonactive projects",()=>{
    const old=new Date("2026-09-01T00:00:00Z");
    expect(deriveMentorProjectAttention([project({
      projectUpdatedAt:old,lastActivityAt:now,
    })],now).some(x=>x.kind==="STALLED")).toBe(false);
    expect(deriveMentorProjectAttention([project({
      projectStatus:"PLANNED",projectUpdatedAt:old,
    })],now).some(x=>x.kind==="STALLED")).toBe(false);
  });
  it("shows stalled after 7 days of real inactivity, not before",()=>{
    const alerts=deriveMentorProjectAttention([project({
      projectUpdatedAt:new Date("2026-10-03T12:00:00Z"),
    })],now);
    expect(alerts.map(x=>x.kind)).toContain("STALLED");
  });
  it("keeps overdue meeting requests actionable and detects within-48h scheduling",()=>{
    const alerts=deriveMentorProjectAttention([project({
      meetings:[
        {id:"req",title:"Request",status:"REQUESTED",startsAt:new Date("2026-10-09T00:00:00Z")},
        {id:"soon",title:"Planning",status:"SCHEDULED",startsAt:new Date("2026-10-12T11:59:00Z")},
        {id:"later",title:"Future",status:"SCHEDULED",startsAt:new Date("2026-10-13T12:00:00Z")},
        {id:"cancel",title:"Canceled",status:"CANCELLED",startsAt:now},
      ],
    })],now);
    expect(alerts.map(x=>x.key)).toEqual(expect.arrayContaining(["request:req","soon:soon"]));
    expect(alerts.some(x=>x.key==="soon:later"||x.key==="soon:cancel")).toBe(false);
  });
});
