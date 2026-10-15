import {expect,it} from "vitest";
import {recruiterBulkAcknowledgeSchema} from "@/modules/placements/tpo-messaging-service";
it("permits at most the current 20 visible distinct conversation IDs",()=>{
 const ids=Array.from({length:20},(_,i)=>"11111111-1111-4111-8111-"+String(i).padStart(12,"0"));
 expect(recruiterBulkAcknowledgeSchema.safeParse(ids).success).toBe(true);
 expect(recruiterBulkAcknowledgeSchema.safeParse([...ids,ids[0]]).success).toBe(false);
});
