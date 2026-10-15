import {it,expect} from "vitest";
import {summarizeEngageAudience} from "@/modules/messaging/engage-audience-model";
const lead={id:"1",emailNorm:"x@example.com",manualStage:"NEW",ownerMembershipId:null,unsubscribedAt:null,inviteBouncedAt:null};
it("excludes explicit opt-outs and bounce records without leaking contact data",()=>{
 const s=summarizeEngageAudience([lead,{...lead,id:"2",unsubscribedAt:new Date()},{...lead,id:"3",emailNorm:null}], "ALL_ELIGIBLE");
 expect(s).toMatchObject({total:3,eligible:1,unsubscribed:1,withoutEmail:1});
 expect(JSON.stringify(s)).not.toContain("example.com");
});
