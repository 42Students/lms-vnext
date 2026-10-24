import {describe,expect,it} from "vitest";
import {deriveMentorProjectAttention,type MentorProjectAttentionSource}
  from "@/modules/projects/mentor-attention";

const now=new Date("2026-10-24T12:00:00.000Z");
const id="00000000-0000-4000-8000-000000000001";
const project=(overrides:Partial<MentorProjectAttentionSource>={}):
  MentorProjectAttentionSource=>({
    projectId:id,projectTitle:"Course team",projectStatus:"ACTIVE",
    projectUpdatedAt:now,lastActivityAt:now,submission:null,meetings:[],
    sprints:[
      {id:"current",title:"Sprint 12",sequence:12,status:"ACTIVE",updatedAt:now},
      {id:"next",title:"Sprint 13",sequence:13,status:"PLANNED",updatedAt:now},
    ],
    tasks:[],...overrides,
  });
const task=(id:string,status:string,sprintId:string|null,updatedAt=now,
  assigneeMembershipId:string|null="learner")=>({
  id,title:id,status,sprintId,assigneeMembershipId,updatedAt,
});

describe("Mentor prototype additional attention classes",()=>{
  it("emits per-task review and blocked alerts with scoped task deep-links",()=>{
    const alerts=deriveMentorProjectAttention([project({tasks:[
      task("review-1","IN_REVIEW","current"),
      task("blocked-1","BLOCKED","current"),
    ]})],now);
    expect(alerts.map(a=>a.kind)).toEqual(["TASK_REVIEW","TASK_BLOCKED"]);
    expect(alerts[0]?.href).toContain("task=review-1");
    expect(alerts[1]?.href).toContain("task=blocked-1");
  });
  it("creates sign-off only when current sprint tasks all recorded as DONE",()=>{
    expect(deriveMentorProjectAttention([project({tasks:[
      task("done","DONE","current"),
    ]})],now).some(a=>a.kind==="SPRINT_SIGN_OFF")).toBe(true);
    expect(deriveMentorProjectAttention([project({tasks:[
      task("done","DONE","current"),task("review","IN_REVIEW","current"),
    ]})],now).some(a=>a.kind==="SPRINT_SIGN_OFF")).toBe(false);
  });
  it("uses next PLANNED sprint unassigned tasks and avoids already assigned",()=>{
    const alerts=deriveMentorProjectAttention([project({tasks:[
      task("unassigned","TODO","next",now,null),
      task("assigned","TODO","next"),
    ]})],now);
    expect(alerts.find(item=>item.kind==="UNASSIGNED_NEXT")?.title)
      .toContain("1 unassigned");
  });
  it("orders oldest first within each priority, leaving final submissions first",()=>{
    const alerts=deriveMentorProjectAttention([project({
      submission:{id:"sub",status:"SUBMITTED",submittedAt:now},
      tasks:[
        task("later","IN_REVIEW","current",new Date("2026-10-23T00:00:00Z")),
        task("older","IN_REVIEW","current",new Date("2026-10-21T00:00:00Z")),
      ],
    })],now);
    expect(alerts.map(a=>a.key).slice(0,3)).toEqual([
      "review:sub","task-review:older","task-review:later",
    ]);
  });
  it("reissues a snoozed composite alert when its underlying task set changes",()=>{
    const first=deriveMentorProjectAttention([project({tasks:[
      task("t1","TODO","next",new Date("2026-10-20T00:00:00Z"),null),
    ]})],now).find(item=>item.kind==="UNASSIGNED_NEXT")!;
    const revised=deriveMentorProjectAttention([project({tasks:[
      task("t1","TODO","next",new Date("2026-10-20T00:00:00Z"),null),
      task("t2","TODO","next",new Date("2026-10-23T00:00:00Z"),null),
    ]})],now).find(item=>item.kind==="UNASSIGNED_NEXT")!;
    expect(first.key).toBe(revised.key);
    expect(first.revision).not.toBe(revised.revision);
    expect(first.occurredAt).toBe(revised.occurredAt);
  });
  it("does not invent sign-off, approval or assignment on missing source lists",()=>{
    expect(deriveMentorProjectAttention([project({sprints:undefined,tasks:undefined})],now))
      .toEqual([]);
    expect(deriveMentorProjectAttention([project({
      projectStatus:"ARCHIVED",tasks:[task("r","IN_REVIEW","current")],
    })],now)).toEqual([]);
  });
});
