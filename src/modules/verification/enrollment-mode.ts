import type {VerificationQueueFilters} from "./queue-filters";
/** Section selection binds all other academic dimensions to the SAME enrollment. */
export function verificationEnrollmentFilterMode(filter:Pick<VerificationQueueFilters,"sectionId"|"batchId"|"branchId"|"programId">):"SECTION"|"PROGRAM"|"ALL"{
 if(filter.sectionId)return "SECTION";
 if(filter.batchId||filter.branchId||filter.programId)return "PROGRAM";
 return "ALL";
}
