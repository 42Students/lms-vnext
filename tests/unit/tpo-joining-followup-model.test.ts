import {describe,expect,it} from "vitest";
import {projectTpoJoiningFollowups,tpoJoiningFollowupCsv,tpoJoiningFollowupQuerySchema,
 TPO_JOINING_FOLLOWUP_CSV_LIMIT} from "@/modules/placements/tpo-joining-followup-model";
const base={jobId:"job",jobTitle:"Engineer",companyName:"=Company",candidateName:"John",
 roleTitle:"Role",offerStatus:"ACCEPTED"};
describe("TPO joining follow-up evidence",()=>{
it("never infers joining from accepted offers, unknown dates or deferred status",()=>{
 const facts=[
  {...base,offerId:"pending",joiningStatus:null,scheduledDate:null},
  {...base,offerId:"due",joiningStatus:"PENDING",scheduledDate:"2026-10-13"},
  {...base,offerId:"deferred",joiningStatus:"DEFERRED",scheduledDate:"2026-10-20"},
  {...base,offerId:"joined",joiningStatus:"JOINED",scheduledDate:"2026-10-14"},
  {...base,offerId:"declined",offerStatus:"DECLINED",joiningStatus:"JOINED",scheduledDate:"2026-10-14"},
 ];
 const r=projectTpoJoiningFollowups(facts,"2026-10-14","ALL");
 expect(r.counts).toEqual({accepted:4,pending:2,deferred:1,joined:1,didNotJoin:0,dueWithRecordedDate:1,dateMissing:1});
 expect(r.rows).toHaveLength(3);
 expect(projectTpoJoiningFollowups(facts,"2026-10-14","DATE_DUE").rows.map(x=>x.offerId)).toEqual(["due"]);
 expect(projectTpoJoiningFollowups(facts,"2026-10-14","DATE_MISSING").rows.map(x=>x.offerId)).toEqual(["pending"]);
 expect(tpoJoiningFollowupCsv(r,"-Season").csv).toContain("'=Company");
});
it("caps CSV and rejects invalid filters",()=>{
 const many=Array.from({length:TPO_JOINING_FOLLOWUP_CSV_LIMIT+2},(_,i)=>({
  ...base,offerId:String(i),joiningStatus:"PENDING",scheduledDate:null,
 }));
 const r=projectTpoJoiningFollowups(many,"2026-10-14","ALL");
 const csv=tpoJoiningFollowupCsv(r,"Year");
 expect(csv.truncated).toBe(true);expect(csv.csv).toContain("TRUNCATED");
 expect(tpoJoiningFollowupQuerySchema.safeParse({state:"JOINED"}).success).toBe(false);
 expect(tpoJoiningFollowupQuerySchema.safeParse({state:"DATE_MISSING"}).success).toBe(true);
});
});
