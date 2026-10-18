import type {CollegeReadinessEvaluation} from "./readiness-model";

/** Navigation-progress indicator only; never a production go-live approval. */
export function summarizeTenantSetupReadiness(evaluation: Pick<CollegeReadinessEvaluation,"overall"|"counts">|null){
 if(!evaluation)return {label:"Unknown",detail:"The selected college has no verified readiness result. No completion is implied."};
 const {passed,failed,unknown,total}=evaluation.counts;
 // The canonical evaluator has ten mandatory checks. A partial or corrupted
 // aggregate cannot be promoted to a completed tenant setup journey.
 if(total!==10||[passed,failed,unknown].some(value=>!Number.isSafeInteger(value)||value<0)||
  passed+failed+unknown!==total)
  return {label:"Unknown",detail:"Readiness check coverage is incomplete or inconsistent. Inspect the gate before proceeding."};
 if(failed>0)return {label:"Not ready",detail:`${passed} of ${total} checks pass; ${failed} fail and ${unknown} are unknown. Resolve confirmed failures before rechecking.`};
 if(unknown>0||evaluation.overall!=="READY"||passed!==total)return {label:"Incomplete evidence",detail:`${passed} of ${total} checks pass; ${unknown} remain unknown. A missing source never counts as ready.`};
 return {label:"Persisted checks pass",detail:`All ${total} persisted checks pass. Runtime DNS, login, browser workflows and final launch approval are still separate gates.`};
}
