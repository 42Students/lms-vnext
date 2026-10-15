import {expect,it} from "vitest";
import {getTpoManualMessageTemplate,tpoTemplateKindSchema,TPO_MANUAL_MESSAGE_TEMPLATES} from "@/modules/placements/tpo-communication-prep-model";
it("provides three explicit non-sending drafts with bounded supported kinds",()=>{
 expect(TPO_MANUAL_MESSAGE_TEMPLATES).toHaveLength(3);
 expect(getTpoManualMessageTemplate("BATCH_REMINDER").label).toBe("Registration reminder");
 expect(tpoTemplateKindSchema.safeParse("SEND_SMS").success).toBe(false);
 expect(TPO_MANUAL_MESSAGE_TEMPLATES.every(item=>!item.body.includes("{{"))).toBe(true);
});
