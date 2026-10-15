import {describe,it,expect} from "vitest";
import {verificationLoading,verificationFailed} from "@/modules/verification/retry-state";
describe("verification retries",()=>{it("retains last successful state on failed refresh",()=>{
 const data={items:[1,2]};
 const loading=verificationLoading({phase:"READY",data});
 expect(verificationFailed(loading,"network")).toEqual({phase:"ERROR",message:"network",previous:data});
});});