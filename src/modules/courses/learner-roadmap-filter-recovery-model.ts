import type {LearnerRoadmapFilter} from "./learner-roadmap-focus-filter-model";
const allowed:readonly LearnerRoadmapFilter[]=["all","lectures","resources","assessments","live-sessions"];
export function learnerRoadmapFilterRecoveryNotice(raw:string):string|null{
 return allowed.some(value=>value===raw)?null:
  "That Learning Path filter is not available. Showing the published learning items instead.";
}
