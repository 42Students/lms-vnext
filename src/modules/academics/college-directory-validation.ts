import type { z } from "zod";

/** Client-safe error detail; values supplied in filters are never echoed. */
export function collegeDirectoryValidationMessage(error: z.ZodError): string {
  const issue=error.issues.find(item=>item.code==="custom");
  if(issue){
    // Custom range rules have fixed, authored messages; never display raw input.
    const descriptions: Record<string,string>={
      startOnOrBefore:"The batch start-date end limit must not precede its beginning.",
      currentTerm:"Choose a recorded progression state to filter by current term.",
      yearStart:"A recorded academic year is required for this year-start filter.",
      creditState:"Unconfigured semester credits cannot have numeric credit bounds.",
      semesterThrough:"The last semester cannot precede the first.",
      maximumAllowedPicks:"Maximum allowed elective choices must be at least the minimum required.",
      periodEndsOnOrBefore:"The linked academic-period end limit cannot precede its beginning.",
      semesterNumber:"The exact semester must fall within the selected interval.",
      periodState:"Unlinked electives cannot use linked academic-period selectors.",
      maximumCapacity:"Maximum class capacity must be at least the minimum.",
      capacityState:"Unconfigured class capacity cannot have numeric bounds.",
      maximumCredits:"Maximum credits must be at least the minimum.",
    };
    const key=String(issue.path[0]??"");
    if(descriptions[key])return descriptions[key];
  }
  return "One or more filters are invalid. Check the values or clear all filters.";
}
