import {z} from "zod";
export const subdomainLabelSchema=z.string().trim().toLowerCase().min(3).max(63).regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])$/);
export const subdomainMoveInputSchema=z.strictObject({collegeId:z.uuid(),label:subdomainLabelSchema,expectedVersion:z.number().int().nonnegative()});
const RESERVED=new Set(["admin","api","www","mail","auth","support","static"]);
export function availableSubdomainLabel(value:string) {
 const parsed=subdomainLabelSchema.safeParse(value);
 return parsed.success && !RESERVED.has(parsed.data);
}
