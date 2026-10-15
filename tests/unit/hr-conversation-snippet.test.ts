import {expect,it} from "vitest";
import {conversationSnippet} from "@/modules/placements/hr-conversation-snippet-model";
it("limits message previews and compacts newlines without leaking full content",()=>{
 expect(conversationSnippet("Hello\n\nteam")).toBe("Hello team");
 expect(conversationSnippet("x".repeat(800)).length).toBe(120);
});
