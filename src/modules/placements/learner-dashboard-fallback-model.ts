import type {PlacementDashboardAvailability} from "./learner-dashboard-partial-model";
/** Safe fallback only if the authorized drive source itself was read successfully. */
export function learnerDashboardSafeFallback(state:PlacementDashboardAvailability){
 if(!state.jobs)return null;
 return {href:"/learn/my-placements/jobs" as const,label:"Browse available drives"};
}
