import { z } from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const collegeBatchRetireSchema = z.strictObject({
  expectedUpdatedAt: z.iso.datetime({offset:true}),
  confirm: z.literal(true),
});
export const collegeBatchRetireIdSchema=zUuid;
export function batchRetirementPrompt(name:string) {
  return `Remove planned batch "${name}" from active use? This archives its record. A batch with classes, students, offerings or progression history cannot be removed.`;
}
