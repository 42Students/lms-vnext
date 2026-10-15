import {expect,it} from "vitest";
import {recoverCompanyShareLinkPage} from "@/modules/placements/company-share/link-page-model";
it("resets malformed company-share page without server error or skipping auth",()=>{
 expect(recoverCompanyShareLinkPage("bad")).toEqual({page:1,wasInvalid:true});
 expect(recoverCompanyShareLinkPage("-1")).toEqual({page:1,wasInvalid:true});
 expect(recoverCompanyShareLinkPage("3")).toEqual({page:3,wasInvalid:false});
});
