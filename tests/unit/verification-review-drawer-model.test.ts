import {describe,it,expect} from "vitest";
import {verificationSnapshotComparison} from "@/modules/verification/snapshot-comparison";
describe("review drawer comparison",()=>{it("shows changed non-sensitive detail beside previous value",()=>{
 const comparison=verificationSnapshotComparison({institution:"New"},{institution:"Old"});
 expect(comparison[0]).toMatchObject({key:"institution",changed:true,submitted:"New",previouslyVerified:"Old"});
});});
