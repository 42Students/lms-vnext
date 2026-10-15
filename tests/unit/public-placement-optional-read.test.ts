import {expect,it} from "vitest";
import {readOptionalPublicPlacementData} from "@/modules/placements/public-page/optional-read-model";
it("hides database errors behind an availability state for the public placement page",async()=>{
 const ok=await readOptionalPublicPlacementData(async()=>({placed:7,offers:9}));
 expect(ok).toEqual({available:true,value:{placed:7,offers:9}});
 const unavailable=await readOptionalPublicPlacementData(async()=>{throw Error("private database connection details")});
 expect(unavailable).toEqual({available:false,value:null});
 const unpublished=await readOptionalPublicPlacementData(async()=>null);
 expect(unpublished).toEqual({available:true,value:null});
});
