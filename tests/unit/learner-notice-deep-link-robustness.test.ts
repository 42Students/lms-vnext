import {expect,it} from "vitest";
import {learnerNoticeFocusPage} from "@/modules/placements/learner-notice-deep-link-model";
it("resolves existing own notice UUID in either case without falling outside authorized records",()=>{
 const id="00000000-0000-4000-8000-abcd12345678",own=[{id:id.toUpperCase()}];
 expect(learnerNoticeFocusPage(own,5,id)).toEqual({page:1,found:true});
 expect(()=>learnerNoticeFocusPage(own,1,id,0)).toThrow("INVALID_NOTICE_PAGE_SIZE");
 expect(learnerNoticeFocusPage(own,3,"00000000-0000-4000-8000-ffffffffffff")).toEqual({page:3,found:false});
});
