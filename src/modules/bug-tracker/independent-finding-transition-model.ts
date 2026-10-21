import {FINDING_STATUSES} from "./independent-audit-findings-model";
export type IndependentFindingStatus=(typeof FINDING_STATUSES)[number];

/** SA-tenants-modules-47: a release must follow a fixed development build;
 * production verification requires a recorded release. Terminal dispositions
 * only reopen through an explicit reason-bearing action. */
export function canTransitionIndependentFinding(
 from:IndependentFindingStatus,to:IndependentFindingStatus,
 note?:string|null,
):boolean{
 if(from===to)return false;
 const reason=Boolean(note?.trim() && note.trim().length>=4);
 if(["WONT_FIX","CANT_REPRODUCE","NEEDS_INFO","VERIFIED"].includes(to) && !reason)return false;
 if(to==="RELEASED_PROD")return from==="FIXED_DEV";
 if(to==="VERIFIED")return from==="RELEASED_PROD"&&reason;
 if(to==="FIXED_DEV")return from==="IN_PROGRESS"||from==="CONFIRMED";
 if(to==="DUPLICATE")return false; // use explicit UUID-validated DUPLICATE action
 if(to==="NEW")return ["VERIFIED","WONT_FIX","CANT_REPRODUCE","NEEDS_INFO","DUPLICATE"].includes(from)&&reason;
 if(["VERIFIED","WONT_FIX","CANT_REPRODUCE","DUPLICATE"].includes(from))
  return to==="IN_PROGRESS"&&reason;
 if(from==="RELEASED_PROD")return to==="IN_PROGRESS"&&reason;
 return true;
}

/** Deliberately stricter vNext migration than the legacy free-form state
 * updates. Existing FIXED_DEV, RELEASED_PROD, VERIFIED and duplicate rows
 * remain readable unchanged; new writes must follow the gate above.
 * Duplicate is a separate UUID-validated action, never a status shortcut. */
export const INDEPENDENT_FINDING_TRANSITION_MIGRATION = {
 fixedDevelopmentRequires:["CONFIRMED","IN_PROGRESS"],
 releaseProductionRequires:["FIXED_DEV"],
 verificationRequires:["RELEASED_PROD"],
 terminalDispositionRequiresNote:true,
 reopeningRequiresNote:true,
 duplicateRequiresSeparateUuidAction:true,
 minimumNoteCharacters:4,
} as const;
