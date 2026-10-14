import type {LearnerJobBrowseFilters} from "./learner-jobs-browse-model";
export type LearnerDrivesEmptyState={
  kind:"NO_PUBLISHED"|"FILTERED_OUT"|"HAS_RESULTS";
  title:string;description:string;showReset:boolean;
};
/** Decisions use only authorized published role count, never unscoped employer records. */
export function learnerDrivesEmptyState(
  publishedCount:number,matchedCount:number,filters:LearnerJobBrowseFilters,
):LearnerDrivesEmptyState{
  if(publishedCount===0)return {
    kind:"NO_PUBLISHED",title:"No published drives yet",
    description:"Your placement team has not published any opportunities for your college yet. Check back or review your placement profile.",
    showReset:false,
  };
  if(matchedCount>0)return {
    kind:"HAS_RESULTS",title:"",description:"",showReset:false,
  };
  if(filters.eligibleOnly||filters.availability==="open")return {
    kind:"FILTERED_OUT",title:"No drives currently open to you",
    description:"Published opportunities exist, but none match your eligibility and selected filters. Review placement rules or clear filters.",
    showReset:true,
  };
  if(filters.closingSoon)return {
    kind:"FILTERED_OUT",title:"No drives closing within seven days",
    description:"There are published opportunities, but none meet this deadline window and your other filters.",
    showReset:true,
  };
  return {
    kind:"FILTERED_OUT",title:"No drives match these filters",
    description:"Published opportunities exist, but none match your keyword, location, type or availability selections.",
    showReset:true,
  };
}
