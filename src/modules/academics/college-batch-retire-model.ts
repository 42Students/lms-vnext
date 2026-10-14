import { z } from "zod";
export const collegeBatchRetireSchema = z.strictObject({
  expectedUpdatedAt: z.iso.datetime({offset:true}),
  confirm: z.literal(true),
});
export const collegeBatchRetireIdSchema=z.string().uuid();
export function batchRetirementPrompt(name:string) {
  return `Remove planned batch "${name}" from active use? This archives its record. A batch with classes, students, offerings or progression history cannot be removed.`;
}
