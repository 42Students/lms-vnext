import {randomUUID} from "node:crypto";
import {describe,expect,it} from "vitest";
import {buildLearnerAssessmentResults,pageLearnerAssessmentResults} from "@/modules/placements/learner-assessment-results-model";
describe("published learner assessment pagination and masking",()=>{
  it("omits unapplied scores, interview/GD rounds and absent publication dates",()=>{
    const result=buildLearnerAssessmentResults([{applicationId:randomUUID(),job:{id:randomUUID(),title:"Engineer"},
      company:{name:"Employer"},results:[
        {resultId:"1",roundKind:"TEST",roundName:"Written",roundSequence:1,outcome:"PASS",scorePercent:90,candidateMessage:null,appliedAt:new Date("2026-10-14T10:00:00Z")},
        {resultId:"2",roundKind:"VENDOR_TEST",roundName:"Hidden",roundSequence:2,outcome:"FAIL",scorePercent:25,candidateMessage:null,appliedAt:null},
        {resultId:"3",roundKind:"INTERVIEW",roundName:"Interview",roundSequence:3,outcome:"PASS",scorePercent:99,candidateMessage:null,appliedAt:new Date("2026-10-14T10:00:00Z")},
      ]}]);
    expect(result.map(row=>row.resultId)).toEqual(["1"]);
    expect(result[0]?.scorePercent).toBe(90);
  });
  it("paginates searched, authorized published rows with strict selectors",()=>{
    const rows=Array.from({length:43},(_,i)=>({
      resultId:String(i),applicationId:"app",jobId:"job",roleTitle:"Engineer",
      companyName:i%2?"Beta":"Acme",roundName:"Test",roundSequence:1,outcome:"PASS",
      scorePercent:null,candidateMessage:null,appliedAt:new Date("2026-10-14T10:00:00Z"),
    }));
    expect(pageLearnerAssessmentResults(rows,{page:2}).items).toHaveLength(20);
    expect(pageLearnerAssessmentResults(rows,{page:3}).items).toHaveLength(3);
    expect(pageLearnerAssessmentResults(rows,{q:"Acme"}).total).toBe(22);
    expect(()=>pageLearnerAssessmentResults(rows,{collegeId:"foreign"})).toThrow();
    expect(()=>pageLearnerAssessmentResults(rows,{page:"NaN"})).toThrow();
  });
});
