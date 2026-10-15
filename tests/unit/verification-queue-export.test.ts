import {describe,it,expect} from "vitest";
import {verificationCsv} from "@/modules/verification/queue-export";
describe("verification export",()=>{it("escapes formulas, quotes and truncates",()=>{
 const row={learnerName:'=HYPERLINK("evil")',section:"EDUCATION",status:"WAITING",submittedAt:"",reviewedAt:""};
 const r=verificationCsv(Array.from({length:1001},()=>row));
 expect(r.truncated).toBe(true);
 expect(r.csv).toContain("'=HYPERLINK");
 expect(r.csv).toContain('""evil""');
 expect(r.csv).toContain("TRUNCATED");
 expect(r.csv.split("\r\n").length).toBe(1003);
});});