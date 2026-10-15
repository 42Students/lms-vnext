import {expect,it} from "vitest";
import {afterCompanyShareRevocation} from "@/modules/placements/company-share/revoke-ui-model";
it("removes just-revoked links from active view without deleting history",()=>{
 const links=[{id:"a",revokedAt:null},{id:"b",revokedAt:null}];
 expect(afterCompanyShareRevocation(links,"a","ACTIVE","now")).toEqual([{id:"b",revokedAt:null}]);
 expect(afterCompanyShareRevocation(links,"a","ALL","now")[0]).toEqual({id:"a",revokedAt:"now"});
});
