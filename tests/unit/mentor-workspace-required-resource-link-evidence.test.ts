import {expect,it} from "vitest";
import {mentorRequiredResourceLinkState} from "@/modules/projects/mentor-workspace-evidence-model";
it("separates required text-only resources from unusable/credential-bearing URLs",()=>{
 expect(mentorRequiredResourceLinkState({required:false,url:null,description:null})).toBe("NOT_REQUIRED");
 expect(mentorRequiredResourceLinkState({required:true,url:"https://example.com",description:null})).toBe("SAFE_LINK");
 expect(mentorRequiredResourceLinkState({required:true,url:null,description:"Internal notes"})).toBe("TEXT_ONLY");
 expect(mentorRequiredResourceLinkState({required:true,url:"https://a:b@example.com",description:null})).toBe("LINK_UNAVAILABLE");
});
