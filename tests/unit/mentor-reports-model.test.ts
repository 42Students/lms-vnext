import {describe,expect,it} from "vitest";
import {mentorReportsOverview,mentorReportsQuerySchema,mentorReportsHref,mentorReportsCsv}
  from "@/modules/projects/mentor-reports-model";
const q=mentorReportsQuerySchema.parse({});
const timestamp=new Date("2026-10-14T10:00:00.000Z");
describe("Mentor assigned-project report summary",()=>{
  const projects=[
    {id:"a",title:"Alpha",status:"ACTIVE",updatedAt:timestamp,isPrimaryMentor:true},
    {id:"b",title:"Beta",status:"COMPLETED",updatedAt:timestamp,isPrimaryMentor:false},
    {id:"c",title:"Gamma",status:"ARCHIVED",updatedAt:timestamp,isPrimaryMentor:false},
  ];
  const attention=[{projectId:"a",kind:"REVIEW" as const},
    {projectId:"a",kind:"REQUESTED" as const},
    {projectId:"other",kind:"STALLED" as const}];
  it("counts only assigned projects and never cross-project alerts",()=>{
    const result=mentorReportsOverview(projects,attention,q);
    expect(result).toMatchObject({projectCount:3,primaryMentorCount:1,
      statusCounts:{ACTIVE:1,COMPLETED:1,ARCHIVED:1,PLANNED:0},
      attentionCounts:{REVIEW:1,STALLED:0,REQUESTED:1,MEETING_SOON:0},
      total:3});
    expect(result.items.find(p=>p.id==="b")?.attention).toEqual([]);
  });
  it("caps and neutralizes spreadsheet exports without learner metadata",()=>{
    const projects=Array.from({length:103},(_,index)=>({
      id:"p"+index,title:index===0?"=Command":"Project "+index,
      status:"ACTIVE",updatedAt:timestamp,isPrimaryMentor:false,
    }));
    const result=mentorReportsOverview(projects,[],q);
    expect(result.exportItems).toHaveLength(100);
    expect(result.exportOmitted).toBe(3);
    const csv=mentorReportsCsv(result.exportItems,result.exportOmitted);
    expect(csv).toContain("'=Command");
    expect(csv).toContain("3 additional matching projects");
    expect(csv).not.toContain("learner_email");
    expect(csv).not.toContain("phone");
  });
  it("filters exact registered status, attention, literal search, and page cap",()=>{
    const select=mentorReportsOverview(projects,attention,{
      ...q,status:"ACTIVE",attention:"REVIEW",search:"alp",
    });
    expect(select.items.map(p=>p.id)).toEqual(["a"]);
    expect(mentorReportsHref({...q,attention:"REQUESTED"}))
      .toContain("attention=REQUESTED");
    expect(mentorReportsQuerySchema.safeParse({...q,collegeId:"fake"}).success).toBe(false);
    expect(mentorReportsQuerySchema.safeParse({...q,status:"WAITING"}).success).toBe(false);
  });
});
