import {verificationAttentionFlags} from "./attention-flags";
import type {VerificationStatus,VerificationSection} from "@/modules/profile-verification/domain";
export type VerificationAttention="ALL"|"MISSING_MARKSHEET";
export function matchesVerificationAttention(input:{
 status:VerificationStatus;section:VerificationSection;submittedAt:Date;missingMarksheet:boolean
}, attention:VerificationAttention, evaluatedAt:Date){
 return attention==="ALL"||verificationAttentionFlags(input,evaluatedAt).includes(attention);
}
