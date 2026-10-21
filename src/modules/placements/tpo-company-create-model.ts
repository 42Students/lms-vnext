import { z } from "zod";
import { createPlacementCompanyInputSchema } from "./validation";

/** College ownership comes from the authenticated TPO membership, never JSON. */
export const tpoCreateCompanySchema = createPlacementCompanyInputSchema
  .omit({ collegeId: true, isTrusted: true })
  .extend({ confirmed: z.literal(true) })
  .strict();

/** Explicit review-only path for a company with the same name but a provably
 * different website/domain. It is NOT permission to re-use a canonical domain,
 * bypass tenant scope, or add aliases automatically. Server must re-read the
 * reviewed identity and serialize domain uniqueness inside the transaction.
 */
export const tpoDistinctCompanyReviewSchema = tpoCreateCompanySchema.extend({
 notTheSame:z.literal(true),
 reviewedCompanyId:z.string().uuid(),
 reviewedCompanyDomain:z.string().trim().toLowerCase().min(3).max(253),
 distinctCompanyReason:z.string().trim().min(20).max(500),
}).superRefine((value,ctx)=>{
 const incoming=(value.primaryDomain??(value.websiteUrl
  ? new URL(value.websiteUrl).hostname.replace(/^www\./i,"") : ""))
   .toLowerCase();
 if(!incoming||incoming===value.reviewedCompanyDomain.replace(/^www\./i,"")){
  ctx.addIssue({code:"custom",path:["primaryDomain"],
   message:"Use a different verified company domain to create a separate company"});
 }
});

/** Existing names may match only after explicit distinct-company review.
 * A matching canonical domain always requires owner verification or merging.
 */
export function distinctCompanyRequiresReview(
 existingName:string,newName:string,existingDomain:string,newDomain:string,
):"NAME_CONFLICT"|"DOMAIN_CONFLICT"|"DISTINCT" {
 const normalizeName=(s:string)=>s.normalize("NFKC").trim().replace(/\s+/g," ").toLowerCase();
 const normalizeDomain=(s:string)=>s.trim().toLowerCase().replace(/^www\./,"");
 if(normalizeDomain(existingDomain)===normalizeDomain(newDomain))return "DOMAIN_CONFLICT";
 return normalizeName(existingName)===normalizeName(newName)?"NAME_CONFLICT":"DISTINCT";
}
