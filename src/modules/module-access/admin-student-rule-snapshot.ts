import type {LearnerModuleTrace} from "./admin-trace-model";
import {membershipOverrideSummary} from "./admin-trace-model";
/** Only membership rule state and resolver flags; never student identity or contact details. */
export function studentRuleSnapshot(modules:readonly LearnerModuleTrace[]){
 return membershipOverrideSummary(modules).map(row=>({
  module:row.module,enabled:row.stored,locked:row.locked,
  ignored:row.ignored,winner:row.winner,
 }));
}
