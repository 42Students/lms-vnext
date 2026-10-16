import {z} from "zod";
export const driveChangeCommandSchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("CREATE"),mode:z.enum(["SUGGEST","ASK"]),
  field:z.enum(["DEADLINE","PAY","ELIGIBILITY","LOCATION","ROUNDS","OTHER"]),
  proposedValue:z.string().trim().min(2).max(2000),reason:z.string().trim().min(3).max(1000)}).strict(),
 z.object({action:z.enum(["ACCEPT","ANSWER","DECLINE","WITHDRAW"]),requestId:z.string().uuid(),
  expectedUpdatedAt:z.iso.datetime({offset:true}),note:z.string().trim().min(3).max(2000)}).strict(),
 z.object({action:z.literal("COMMENT"),requestId:z.string().uuid(),body:z.string().trim().min(1).max(2000)}).strict(),
]);
