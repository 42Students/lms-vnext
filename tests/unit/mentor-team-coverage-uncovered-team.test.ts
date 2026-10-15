import {expect,it} from "vitest";
import {mentorTeamCoverageQuerySchema,selectMentorTeamCoverage} from "@/modules/projects/mentor-team-coverage-model";
const rows=[
 {projectId:"p1",title:"Alpha",status:"ACTIVE",learners:0,mentors:1,hasPrimaryMentor:false,isPrimaryMentor:true},
 {projectId:"p2",title:"Bravo",status:"ACTIVE",learners:5,mentors:3,hasPrimaryMentor:true,isPrimaryMentor:false},
 {projectId:"p3",title:"Charlie",status:"ACTIVE",learners:2,mentors:2,hasPrimaryMentor:true,isPrimaryMentor:true},
];
it("filters/sorts assigned live team coverage by uncovered-team",()=>{
 const query=mentorTeamCoverageQuerySchema.parse({filter:"NO_LEARNERS_NO_PRIMARY"});
 const result=selectMentorTeamCoverage(rows,query);
 expect(result.items.map(row=>row.projectId)).toEqual(["p1"]);
 expect(result.total).toBe(1);
 expect(mentorTeamCoverageQuerySchema.safeParse({filter:"INVALID"}).success).toBe(false);
});
