import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const learnerRequestCancelSchema=z.object({
  requestId:zUuid,
  status:z.literal("PENDING"),
  expectedUpdatedAt:z.string().datetime({offset:true}),
  confirmed:z.literal(true),
}).strict();
export function learnerRequestCancelPayload(input:unknown){
  const parsed=learnerRequestCancelSchema.parse(input);
  return {requestId:parsed.requestId,expectedUpdatedAt:parsed.expectedUpdatedAt,action:"CANCEL" as const};
}
