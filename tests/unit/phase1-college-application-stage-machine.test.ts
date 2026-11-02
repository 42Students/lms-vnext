import {describe,expect,it} from "vitest";
import {
 COLLEGE_APPLICATION_STAGES,COLLEGE_APPLICATION_TRANSITIONS,COLLEGE_APPLICATION_CORRECTIONS,
 collegeStageOptionsForLegacyStatus,collegeStageMoveFeedback,
} from "@/modules/placements/college-stage-action-model";

const STAGES=[...COLLEGE_APPLICATION_STAGES];

describe("PHASE1-STATE-STAGE college application pipeline graph",()=>{
 it("PHASE1-STATE-STAGE-01 lists the eight pipeline stages in legacy order",()=>{
  expect(STAGES).toEqual(["APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED"]);
 });

 it("PHASE1-STATE-STAGE-02 has an entry for every stage and only references known stages",()=>{
  expect(Object.keys(COLLEGE_APPLICATION_TRANSITIONS).sort()).toEqual([...STAGES].sort());
  for(const from of STAGES)for(const to of COLLEGE_APPLICATION_TRANSITIONS[from]!)
   expect(STAGES,`${from} -> ${to}`).toContain(to);
  for(const [from,tos] of Object.entries(COLLEGE_APPLICATION_CORRECTIONS)){
   expect(STAGES,from).toContain(from);
   for(const to of tos)expect(STAGES,`${from} correct-> ${to}`).toContain(to);
  }
 });

 it("PHASE1-STATE-STAGE-03 never allows a self transition or duplicate destination",()=>{
  for(const from of STAGES){
   const tos=COLLEGE_APPLICATION_TRANSITIONS[from]!;
   expect(tos,from).not.toContain(from);
   expect(new Set(tos).size,from).toBe(tos.length);
  }
 });

 it("PHASE1-STATE-STAGE-04 REJECTED is terminal and HIRED can only be corrected back to OFFERED",()=>{
  expect(COLLEGE_APPLICATION_TRANSITIONS.REJECTED).toEqual([]);
  expect(COLLEGE_APPLICATION_TRANSITIONS.HIRED).toEqual(["OFFERED"]);
  for(const from of STAGES)expect(COLLEGE_APPLICATION_TRANSITIONS[from]).not.toContain("APPLIED");
 });

 it("PHASE1-STATE-STAGE-05 nothing can jump straight to HIRED except from OFFERED",()=>{
  for(const from of STAGES)
   expect(COLLEGE_APPLICATION_TRANSITIONS[from]!.includes("HIRED"),from).toBe(from==="OFFERED");
 });

 it("PHASE1-STATE-STAGE-06 an offer is reached only from interview or waitlist, or by rolling a hire back",()=>{
  const into=STAGES.filter(from=>COLLEGE_APPLICATION_TRANSITIONS[from]!.includes("OFFERED"));
  expect(into.sort()).toEqual(["HIRED","INTERVIEW","WAITLISTED"]);
  for(const early of ["APPLIED","SHORTLISTED","ASSESSMENT","REJECTED"])expect(into).not.toContain(early);
 });

 it("PHASE1-STATE-STAGE-07 every non-terminal stage can still reach REJECTED (a rejection is always possible)",()=>{
  for(const from of STAGES.filter(s=>s!=="REJECTED"&&s!=="HIRED"))
   expect(COLLEGE_APPLICATION_TRANSITIONS[from],from).toContain("REJECTED");
 });

 it("PHASE1-STATE-STAGE-08 corrections are only offered from stages that have a documented corrective move",()=>{
  expect(Object.keys(COLLEGE_APPLICATION_CORRECTIONS).sort()).toEqual(["ASSESSMENT","HIRED","INTERVIEW","SHORTLISTED"]);
  for(const stage of STAGES.filter(s=>!(s in COLLEGE_APPLICATION_CORRECTIONS)))
   expect(collegeStageOptionsForLegacyStatus(stage).correct,stage).toEqual([]);
 });
});

describe("PHASE1-STATE-STAGE-OPTIONS legacy status option resolver",()=>{
 it("PHASE1-STATE-STAGE-OPTIONS-01 returns the documented move and correction lists for every stage",()=>{
  for(const stage of STAGES){
   const o=collegeStageOptionsForLegacyStatus(stage);
   expect(o.move,stage).toEqual([...COLLEGE_APPLICATION_TRANSITIONS[stage]!]);
   expect(o.correct,stage).toEqual([...(COLLEGE_APPLICATION_CORRECTIONS[stage]??[])]);
  }
 });

 it("PHASE1-STATE-STAGE-OPTIONS-02 normalises case and whitespace",()=>{
  expect(collegeStageOptionsForLegacyStatus("  shortlisted ")).toEqual(collegeStageOptionsForLegacyStatus("SHORTLISTED"));
  expect(collegeStageOptionsForLegacyStatus("Interview").move).toContain("OFFERED");
 });

 it("PHASE1-STATE-STAGE-OPTIONS-03 unknown, withdrawn, prototype and non-string statuses offer nothing",()=>{
  const none={move:[],correct:[]};
  for(const bad of ["WITHDRAWN","","UNKNOWN","constructor","__proto__","toString","hasOwnProperty",null,undefined,7,{},[],true])
   expect(collegeStageOptionsForLegacyStatus(bad),String(bad)).toEqual(none);
 });

 it("PHASE1-STATE-STAGE-OPTIONS-04 returns copies so callers cannot mutate the transition tables",()=>{
  const a=collegeStageOptionsForLegacyStatus("APPLIED");
  a.move.push("HIRED");
  expect(collegeStageOptionsForLegacyStatus("APPLIED").move).toEqual(["SHORTLISTED","REJECTED"]);
  expect(COLLEGE_APPLICATION_TRANSITIONS.APPLIED).toEqual(["SHORTLISTED","REJECTED"]);
 });
});

describe("PHASE1-STATE-STAGE-FEEDBACK bulk move feedback wording",()=>{
 it("PHASE1-STATE-STAGE-FEEDBACK-01 names the destination and the real moved count for Assessment",()=>{
  expect(collegeStageMoveFeedback("MOVE","ASSESSMENT",1,0)).toEqual({title:"1 application moved to Assessment",failurePrefix:"Failed to move to Assessment. "});
  expect(collegeStageMoveFeedback("MOVE","ASSESSMENT",3,0).title).toBe("3 applications moved to Assessment");
  expect(collegeStageMoveFeedback("MOVE","ASSESSMENT",2,1).title).toBe("2 applications moved to Assessment · 1 skipped");
 });

 it("PHASE1-STATE-STAGE-FEEDBACK-02 never reports a partial batch as plain success",()=>{
  for(const action of ["MOVE","REINSTATE","CORRECT"] as const)
   expect(collegeStageMoveFeedback(action,"INTERVIEW",2,3).title).toBe("2 updated, 3 skipped");
  expect(collegeStageMoveFeedback("MOVE","INTERVIEW",1,0).title).toBe("Application status updated");
 });

 it("PHASE1-STATE-STAGE-FEEDBACK-03 only a MOVE to Assessment gets the Assessment failure prefix",()=>{
  expect(collegeStageMoveFeedback("CORRECT","ASSESSMENT",1,0).failurePrefix).toBe("");
  expect(collegeStageMoveFeedback("REINSTATE","ASSESSMENT",1,0).failurePrefix).toBe("");
  expect(collegeStageMoveFeedback("MOVE","INTERVIEW",1,0).failurePrefix).toBe("");
 });
});
