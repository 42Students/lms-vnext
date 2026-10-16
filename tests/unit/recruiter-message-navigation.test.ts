import {expect,it} from "vitest";
import {getShellNavigation} from "@/components/shell/shell-model";
import type {RequestContext} from "@/modules/identity/context";

it("REC-calendar-messages-profile-08: recruiter Messages opens the conversations inbox",()=>{
 const context={user:{id:"recruiter",platformStatus:"ACTIVE"},membership:null,
  recruiter:{status:"ACTIVE",companyId:"co",grants:[{collegeId:"college",companyRelationshipId:"rel"}]}} as unknown as RequestContext;
 const rows=getShellNavigation(context);
 const messages=rows.find(item=>item.label==="Messages");
 expect(messages?.href).toBe("/recruiter/messages");
 expect(messages?.href).not.toBe("/hr/messages");
});
