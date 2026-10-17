import type {LearnerApplicationBrowseFilters} from "./learner-applications-browse-model";
export function learnerApplicationActiveFilterCount(filters:LearnerApplicationBrowseFilters){
return Number(Boolean(filters.search.trim()))+Number(filters.view!=="progress")+
Number(filters.stage!=="all")+Number(filters.sort!=="activity");
}
export function learnerApplicationMobileSummary(filters:LearnerApplicationBrowseFilters){
const count=learnerApplicationActiveFilterCount(filters);
return count===0?"Show application filters":"Show application filters ("+count+" active)";
}
