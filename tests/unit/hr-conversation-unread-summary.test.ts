import {expect,it} from "vitest";
import {summarizeRecruiterUnread} from "@/modules/placements/hr-conversation-unread-model";
it("does not report negative or nonexistent unread counts",()=>{
 expect(summarizeRecruiterUnread([{unread:3},{unread:0}])).toBe(3);
 expect(summarizeRecruiterUnread([{unread:-1}])).toBe(0);
});
