import {describe,it,expect} from "vitest";
import {verificationSnapshotComparison} from "@/modules/verification/snapshot-comparison";
describe("snapshot comparison",()=>{it("never prints identity numbers",()=>{
 const items=verificationSnapshotComparison({aadhaarNumber:"XXXXXXXX1234",institution:"New"},{aadhaarNumber:"XXXXXXXX1234",institution:"Old"});
 expect(items).toEqual([{key:"institution",submitted:"New",previouslyVerified:"Old",changed:true}]);
});});