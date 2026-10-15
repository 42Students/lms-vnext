import {expect,it} from "vitest";
import {countScopedConversations,hrConversationPageBounds,scopeRecruiterConversations} from "@/modules/placements/hr-conversation-inbox-model";
it("reports only general/drive-matching rows as filtered total before pagination",()=>{
 const items=[{id:"g",jobId:null},{id:"d",jobId:"drive"}];
 const scoped=scopeRecruiterConversations(items,"DRIVE");
 const total=countScopedConversations(scoped);
 expect(total).toBe(1);
 expect(hrConversationPageBounds(1,total)).toMatchObject({pages:1,first:1,last:1});
});
