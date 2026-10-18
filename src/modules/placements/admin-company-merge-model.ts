import {z} from "zod";

/** Require an explicit, unambiguous, non-self merge. */
export const companyMergeInputSchema = z.strictObject({
  keepCompanyId: z.uuid(),
  mergeCompanyId: z.uuid(),
  confirm: z.literal(true),
}).refine(value=>value.keepCompanyId!==value.mergeCompanyId,{
  message:"Choose two different companies.",
});

export class CompanyMergeError extends Error {
  constructor(public readonly code:
    "COMPANY_NOT_FOUND" | "MERGE_SOURCE_SHARED_OUTSIDE_COLLEGE" |
    "MERGE_SOURCE_UNLINKED" | "MERGE_TARGET_UNLINKED" |
    "MERGE_COMPANY_INACTIVE") {
    super(code);
    this.name="CompanyMergeError";
  }
}
