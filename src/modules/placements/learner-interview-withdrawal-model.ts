import {z} from "zod";
export const learnerInterviewWithdrawalInputSchema=z.object({
  applicationId:z.uuid(),roundId:z.uuid(),
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  reason:z.string().trim().min(3).max(2000),confirmed:z.literal(true),
}).strict();
export type LearnerInterviewWithdrawalTarget={
  applicationId:string;roundId:string;expectedUpdatedAt:string;pending:boolean;
};
export function learnerInterviewWithdrawalTarget(
  targets:readonly LearnerInterviewWithdrawalTarget[],applicationId:string,roundId:string,
){return targets.find(x=>x.applicationId===applicationId&&x.roundId===roundId)??null;}
