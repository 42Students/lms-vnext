import type {LearnerJobBrowseFilters} from "./learner-jobs-browse-model";
export function learnerJobsActiveFilterCount(filters:LearnerJobBrowseFilters){
return Number(Boolean(filters.search.trim()))+
Number(filters.employmentType!=="all")+
Number(filters.location!=="all")+
Number(filters.availability!=="all")+
Number(filters.eligibleOnly)+Number(filters.closingSoon)+
Number(filters.sort!=="deadline");
}
export function learnerJobsMobileFilterLabel(filters:LearnerJobBrowseFilters){
const count=learnerJobsActiveFilterCount(filters);
return count===0?"Show drive filters":"Show drive filters ("+count+" active)";
}
