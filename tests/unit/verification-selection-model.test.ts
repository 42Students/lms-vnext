import {describe,it,expect} from "vitest";
import {toggleVerificationSelection,retainVisibleSelection} from "@/modules/verification/selection-model";
describe("selection model",()=>{it("uses composite keys and removes hidden choices",()=>{
 const a={learnerMembershipId:"same",section:"EDUCATION" as const};const b={learnerMembershipId:"same",section:"IDENTITY" as const};
 const selected=toggleVerificationSelection(toggleVerificationSelection(new Set(),a),b);
 expect(selected.size).toBe(2);expect(retainVisibleSelection(selected,[b]).size).toBe(1);
});});