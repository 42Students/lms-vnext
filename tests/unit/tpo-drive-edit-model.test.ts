import {describe,expect,it} from "vitest";
import {evaluateTpoDriveEdit,tpoDriveEditSchema} from "@/modules/placements/tpo-drive-edit-model";
const input={confirmed:true as const,expectedUpdatedAt:"2026-10-14T14:00:00.123Z",
 reason:"Revise opening details",title:"Engineer",description:"Updated draft",locations:["Hyderabad"],
 openings:2,minimumAnnualCtcInr:500000,maximumAnnualCtcInr:1000000};
describe("TPO draft edit policy",()=>{
 it("normalizes equivalent IST version tokens without weakening validation",()=>{
  expect(tpoDriveEditSchema.parse({...input,expectedUpdatedAt:"2026-10-14T19:30:00.123+05:30"})
   .expectedUpdatedAt).toBe(input.expectedUpdatedAt);
  expect(tpoDriveEditSchema.safeParse({...input,expectedUpdatedAt:"yesterday"}).success).toBe(false);
 });
 it("permits only active-season drafts with consistent CTC",()=>{
  expect(evaluateTpoDriveEdit("DRAFT","ACTIVE",input)).toBe("ALLOW");
  expect(evaluateTpoDriveEdit("PUBLISHED","ACTIVE",input)).toBe("READ_ONLY");
  expect(evaluateTpoDriveEdit("DRAFT","CLOSED",input)).toBe("READ_ONLY");
  expect(evaluateTpoDriveEdit("DRAFT","ACTIVE",{...input,maximumAnnualCtcInr:100})).toBe("INVALID_CTC");
 });
 it("validates confirmation, scope-free input and location uniqueness",()=>{
  expect(tpoDriveEditSchema.safeParse({...input,confirmed:false}).success).toBe(false);
  expect(tpoDriveEditSchema.safeParse({...input,collegeId:"attacker"}).success).toBe(false);
  expect(evaluateTpoDriveEdit("DRAFT","ACTIVE",{...input,locations:["Pune","pune"]})).toBe("DUPLICATE_LOCATION");
 });
});
