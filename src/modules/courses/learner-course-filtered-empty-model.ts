type Filters={query:string;continueOnly:boolean;typeFilter:"all"|"core"|"elective";termState:"ALL"|"CURRENT"|"HISTORY";progressFilter:"ALL"|"NOT_STARTED"|"IN_PROGRESS"|"COMPLETED"|"UNMEASURED";periodCount:number};
/** Empty states must reflect every active learner filter, not falsely claim no regular Courses. */
export function learnerCourseFilteredEmptyTitle(f:Filters):string {
 if(f.periodCount===0)return "No courses in this semester";
 if(f.query.trim())return `No courses match “${f.query.trim()}”`;
 if(f.continueOnly)return "No courses with a next learning step match these filters";
 if(f.termState==="CURRENT")return "No active courses match these filters";
 if(f.termState==="HISTORY")return "No past courses match these filters";
 if(f.progressFilter!=="ALL")return "No courses match this progress filter";
 if(f.typeFilter==="elective")return "No electives to show right now.";
 if(f.typeFilter==="core")return "No regular courses to show — everything this semester is an elective.";
 return "No courses match the current filters";
}
