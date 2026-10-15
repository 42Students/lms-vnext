import {describe,it,expect} from "vitest";
import {toggleVerificationSelection,retainVisibleSelection,selectEligibleVerificationKeys} from "@/modules/verification/selection-model";
describe("selection model",()=>{it("uses composite keys and removes hidden choices",()=>{
 const a={learnerMembershipId:"same",section:"EDUCATION" as const};const b={learnerMembershipId:"same",section:"IDENTITY" as const};
 const selected=toggleVerificationSelection(toggleVerificationSelection(new Set(),a),b);
 expect(selected.size).toBe(2);expect(retainVisibleSelection(selected,[b]).size).toBe(1);
});});
describe("verification select current visible page",()=>{it("excludes decided requests and caps the selected set",()=>{
 const rows=Array.from({length:30},(_,i)=>({learnerMembershipId:String(i),section:"IDENTITY" as const,status:i===0?"VERIFIED":"SUBMITTED"}));
 const keys=selectEligibleVerificationKeys(rows);
 expect(keys.size).toBe(20);
 expect(keys.has("0:IDENTITY")).toBe(false);
});});
