import {describe,it,expect} from "vitest";
import {projectTpoRoundResultTable,tpoRoundResultTableQuerySchema} from "@/modules/placements/tpo-round-result-table-model";
describe("TPO round result entry table",()=>{
 it("shows current shortlisted rows, locks applied outcomes and counts statuses",()=>{
  const rows=[
   {applicationId:"1",student:"A",role:"Engineer",applicationStatus:"SUBMITTED",screeningStatus:"SHORTLISTED",
     resultId:null,resultStatus:null,outcome:null},
   {applicationId:"2",student:"B",role:"Engineer",applicationStatus:"SUBMITTED",screeningStatus:"SHORTLISTED",
     resultId:"r",resultStatus:"APPLIED",outcome:"PASS"},
   {applicationId:"3",student:"C",role:"Engineer",applicationStatus:"WITHDRAWN",screeningStatus:"SHORTLISTED",
     resultId:null,resultStatus:null,outcome:null},
  ];
  const result=projectTpoRoundResultTable(rows,{kind:"INTERVIEW",status:"COMPLETED",jobStatus:"PUBLISHED"});
  expect(result.counts).toEqual({eligible:2,staged:0,applied:1,remaining:1});
  expect(result.rows.map(x=>x.editable)).toEqual([true,false]);
  expect(projectTpoRoundResultTable(rows,{kind:"TALK",status:"SCHEDULED",jobStatus:"PUBLISHED"}).rows[0]?.editable).toBe(false);
  for(const jobStatus of ["DRAFT","CLOSED","ARCHIVED"])
   expect(projectTpoRoundResultTable(rows,{kind:"INTERVIEW",status:"SCHEDULED",jobStatus}).rows[0]?.editable).toBe(false);
 });
 it("validates both round and job IDs",()=>{
  expect(tpoRoundResultTableQuerySchema.safeParse({jobId:"not-uuid",roundId:"also-no"}).success).toBe(false);
 });
});
