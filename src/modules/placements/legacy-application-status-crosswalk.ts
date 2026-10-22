/** Legacy JobDetailContent status is a display stage, not an authority to
 * mutate offers or re-enter a completed interview round. The canonical
 * application lifecycle remains SUBMITTED/WITHDRAWN with separate screening,
 * round outcomes and released offers.
 */
export const LEGACY_APPLICATION_STATUS_CROSSWALK=[
 {legacy:"APPLIED",application:"SUBMITTED",signal:"application receipt",reapply:false},
 {legacy:"WITHDRAWN",application:"WITHDRAWN",signal:"withdrawn_at",reapply:"CONDITIONAL"},
 {legacy:"SHORTLISTED",application:"SUBMITTED",signal:"approved screening outcome",reapply:false},
 {legacy:"ASSESSMENT",application:"SUBMITTED",signal:"current released assessment round",reapply:false},
 {legacy:"INTERVIEW",application:"SUBMITTED",signal:"current released interview round",reapply:false},
 {legacy:"OFFERED",application:"SUBMITTED",signal:"released ISSUED/ACCEPTED offer",reapply:false},
 {legacy:"HIRED",application:"SUBMITTED",signal:"accepted offer with JOINED outcome",reapply:false},
 {legacy:"REJECTED",application:"SUBMITTED",signal:"released screening or round rejection",reapply:false},
] as const;
export type LegacyApplicationDisplayStatus=
 typeof LEGACY_APPLICATION_STATUS_CROSSWALK[number]["legacy"];

/** An early withdrawal may be resubmitted only by its owner, on the SAME
 * application/role/channel, after current eligibility and audience checks,
 * and before any offer, round, booking, schedule exception or non-retryable
 * screening. The application transaction enforces these conditions under
 * locks; this adapter never substitutes for that check.
 */
export const LEGACY_REAPPLY_DECISION={
 default:"DENY",
 eligibleStatus:"WITHDRAWN",
 reactivatedStatus:"SUBMITTED",
 preserveFirstAppliedAt:true,
 requireSameChannel:true,
 denyOnPriorOffer:true,
 denyOnPriorRound:true,
 denyOnBookedInterview:true,
 denyOnScheduledRoundException:true,
 requireFreshEligibility:true,
 requireRateLimit:true,
} as const;
export function isLegacyAppliedStatus(raw:string):boolean{
 return raw.trim().toUpperCase()==="APPLIED"||raw.trim().toUpperCase()==="SUBMITTED";
}
