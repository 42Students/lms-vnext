import { z } from "zod";
import { isCareerRoundVisible } from "./learner-round-visibility-policy";
const schema=z.object({
  applicationId:z.string().uuid().optional(),
  roundId:z.string().uuid().optional(),
}).strict().refine(
  input=>Boolean(input.applicationId)===Boolean(input.roundId),
  {message:"Provide both application and assessment round identifiers"},
);
export function resolveOwnAssessmentDeepLink(
  own:readonly {applicationId:string;roundId:string;roundKind:string}[],
  raw:unknown,
):{valid:true;key:string|null}|{valid:false} {
  const parsed=schema.safeParse(raw);
  if(!parsed.success)return {valid:false};
  const {applicationId,roundId}=parsed.data;
  if(!applicationId||!roundId)return {valid:true,key:null};
  return own.some(row=>row.applicationId===applicationId &&
    row.roundId===roundId && isCareerRoundVisible("ASSESSMENT",row.roundKind))
    ? {valid:true,key:applicationId+":"+roundId} : {valid:false};
}
