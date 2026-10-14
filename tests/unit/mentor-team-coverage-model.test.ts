import { describe, expect, it } from "vitest";
import {
  mentorTeamCoverageHref, mentorTeamCoverageQuerySchema,
  selectMentorTeamCoverage, summarizeActiveProjectTeam,
  type MentorTeamCoverageRow,
} from "@/modules/projects/mentor-team-coverage-model";

const rows: MentorTeamCoverageRow[] = [
  {projectId:"p1",title:"Atlas",status:"ACTIVE",learners:3,mentors:1,hasPrimaryMentor:true},
  {projectId:"p2",title:"Beacon",status:"PLANNED",learners:0,mentors:1,hasPrimaryMentor:true},
  {projectId:"p3",title:"Cobalt",status:"ACTIVE",learners:1,mentors:1,hasPrimaryMentor:false},
];
describe("Mentor team coverage read model",() => {
  it("counts only the supplied active membership facts",() => {
    expect(summarizeActiveProjectTeam([
      {role:"MENTOR",isPrimary:true},{role:"MENTOR",isPrimary:false},
      {role:"LEARNER",isPrimary:false},{role:"LEARNER",isPrimary:false},
    ])).toEqual({learners:2,mentors:2,hasPrimaryMentor:true});
    expect(summarizeActiveProjectTeam([])).toEqual({
      learners:0,mentors:0,hasPrimaryMentor:false,
    });
  });
  it("filters missing learners and missing primary Mentor without guessing staffing",() => {
    const base={search:"",page:1};
    expect(selectMentorTeamCoverage(rows,{...base,filter:"NO_LEARNERS"}).items.map(x=>x.projectId))
      .toEqual(["p2"]);
    expect(selectMentorTeamCoverage(rows,{...base,filter:"NO_PRIMARY_MENTOR"}).items.map(x=>x.projectId))
      .toEqual(["p3"]);
    expect(selectMentorTeamCoverage(rows,{...base,filter:"ALL",search:"atl"}).items.map(x=>x.projectId))
      .toEqual(["p1"]);
    expect(selectMentorTeamCoverage([],{...base,filter:"ALL",page:22})).toMatchObject({
      total:0,page:1,totalPages:1,items:[],
    });
  });
  it("rejects caller-controlled membership and tenant selectors",() => {
    expect(mentorTeamCoverageQuerySchema.safeParse({collegeId:"foreign"}).success).toBe(false);
    expect(mentorTeamCoverageQuerySchema.safeParse({projectId:"foreign"}).success).toBe(false);
    expect(mentorTeamCoverageQuerySchema.safeParse({filter:"NO_MENTOR"}).success).toBe(false);
    expect(mentorTeamCoverageQuerySchema.safeParse({page:0}).success).toBe(false);
    expect(mentorTeamCoverageQuerySchema.safeParse({search:"x".repeat(121)}).success).toBe(false);
  });
  it("keeps only bounded filter parameters in links",() => {
    expect(mentorTeamCoverageHref({filter:"NO_LEARNERS",search:"A & B",page:2}))
      .toBe("/mentor/team-coverage?filter=NO_LEARNERS&search=A+%26+B&page=2");
  });
});
