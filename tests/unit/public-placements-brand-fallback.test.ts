import {expect,it} from "vitest";
import {publicPageAvailabilityMessage} from "@/modules/placements/public-page/public-page-availability-model";
import {readOptionalPublicPlacementData} from "@/modules/placements/public-page/optional-read-model";
it("contains public branding failure without accidentally querying unavailable statistics",async()=>{
 const brand=await readOptionalPublicPlacementData(async()=>{throw Error("private database host")});
 expect(brand.available).toBe(false);
 expect(publicPageAvailabilityMessage("branding")).not.toContain("private database host");
 expect(publicPageAvailabilityMessage("metrics")).toContain("temporarily unavailable");
});
