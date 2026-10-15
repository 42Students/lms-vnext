import {expect,it} from "vitest";
import {recruiterBulkAcknowledgeSchema} from "@/modules/placements/tpo-messaging-service";
const id="11111111-1111-4111-8111-111111111111";
it("requires 1–20 distinct UUID threads before beginning a batch transaction",()=>{
 expect(recruiterBulkAcknowledgeSchema.parse([id])).toEqual([id]);
 expect(recruiterBulkAcknowledgeSchema.safeParse([]).success).toBe(false);
 expect(recruiterBulkAcknowledgeSchema.safeParse([id,id]).success).toBe(false);
 expect(recruiterBulkAcknowledgeSchema.safeParse(Array(21).fill(id)).success).toBe(false);
 expect(recruiterBulkAcknowledgeSchema.safeParse(["../../../admin"]).success).toBe(false);
});
