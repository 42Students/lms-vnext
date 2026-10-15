import {describe,it,expect} from "vitest";
import {verificationFailed,verificationLoading} from "@/modules/verification/retry-state";
describe("export retry",()=>{it("preserves explicit error state without pretending download succeeded",()=>{
 expect(verificationFailed(verificationLoading({phase:"IDLE"}),"EXPORT_UNAVAILABLE"))
 .toMatchObject({phase:"ERROR",message:"EXPORT_UNAVAILABLE"});
});});
