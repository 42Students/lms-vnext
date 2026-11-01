import { z } from "zod";
import { afterCollegeManualSchema, type AfterCollegeOutcome } from "./tpo-after-college-model";

/** The source's non-placement custom label is bound to the same college and
 * outcome, not arbitrary text or a learner-provided consent choice. */
export class AfterCollegeDetailValidationError extends Error {
  constructor(){super("AFTER_COLLEGE_INVALID_LABEL");this.name="AfterCollegeDetailValidationError";}
}
const catalogSchema=z.array(z.object({
  label:z.string().trim().min(2).max(60),
  outcome:afterCollegeManualSchema,
}).passthrough());
export type AfterCollegeOutcomeDetails={outcomeLabel:string|null;outcomeDetail:string|null};
export function normalizeTpoAfterCollegeDetails(
  outcome:AfterCollegeOutcome,
  input:{outcomeLabel?:string|null;outcomeDetail?:string|null},
  previous:({outcome:string}&AfterCollegeOutcomeDetails)|null,
  rawCatalog:unknown,
):AfterCollegeOutcomeDetails{
  const retained=previous?.outcome===outcome?previous:null;
  const label=(input.outcomeLabel===undefined?retained?.outcomeLabel:
    input.outcomeLabel)?.trim()||null;
  const detail=(input.outcomeDetail===undefined?retained?.outcomeDetail:
    input.outcomeDetail)?.trim()||null;
  if(label){
    const parsed=catalogSchema.safeParse(rawCatalog);
    if(!parsed.success||!parsed.data.some(row=>
      row.label===label&&row.outcome===outcome))
      throw new AfterCollegeDetailValidationError();
  }
  if(label && label.length>60 || detail && detail.length>200)
    throw new AfterCollegeDetailValidationError();
  return {outcomeLabel:label,outcomeDetail:detail};
}
