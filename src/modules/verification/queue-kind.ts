import type {VerificationQueueFilters} from "./queue-filters";
export const VERIFICATION_SECTIONS=["EDUCATION","IDENTITY"] as const;
/** Narrow the physical read before the 5,001-row working-set safety cap. */
export function verificationSqlSections(kind:VerificationQueueFilters["kind"]){
 return kind?[kind]:[...VERIFICATION_SECTIONS];
}
