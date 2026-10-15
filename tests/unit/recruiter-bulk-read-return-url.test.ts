import {expect,it} from "vitest";
import {recruiterInboxReturnUrl} from "@/modules/placements/hr-conversation-return-url-model";
const from="https://lms.example/api/placements/recruiter/conversations/acknowledge";
it("allows only locally validated recruiter inbox return URLs",()=>{
 const valid="/hr/conversations?collegeId=11111111-1111-4111-8111-111111111111&page=2";
 expect(recruiterInboxReturnUrl(valid,from).pathname).toBe("/hr/conversations");
 expect(recruiterInboxReturnUrl(valid,from).searchParams.get("page")).toBe("2");
 expect(recruiterInboxReturnUrl("https://attacker.example/collect",from).search).toBe("");
 expect(recruiterInboxReturnUrl("/admin",from).pathname).toBe("/hr/conversations");
 expect(recruiterInboxReturnUrl("/hr/conversations?sort=HACK",from).search).toBe("");
});
