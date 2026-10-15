import type {LearnerModuleTrace} from "./admin-trace-model";
import {membershipOverrideSummary} from "./admin-trace-model";
export function studentRuleCards(modules:readonly LearnerModuleTrace[]){
 return membershipOverrideSummary(modules).map(item=>({
  ...item,
  state:item.stored===null?"Inherit":item.stored?"On":"Off",
  consequence:item.ignored?"Stored only: placements ignores member scope":item.winner?"Selected by resolver":"Inherits or is masked by another rule",
 }));
}
