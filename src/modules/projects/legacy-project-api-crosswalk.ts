/** Authorized, explicitly scoped crosswalk for the original monolithic
 * ProjectWorkspaceController. Feature writes stay in independent vNext APIs.
 * Never interpret this object as a permission grant or as a promise that
 * unsupported old payloads can be submitted directly.
 */
export type WorkspaceLegacySection=
  "summary"|"overview"|"team"|"releases"|"sprints"|"tasks"|
  "resources"|"meetings"|"readiness"|"activity"|"delivery";
type Binding={section:WorkspaceLegacySection;legacy:string;method:"GET"|"POST"|"PATCH"|"PUT"|"DELETE";
 endpoint:string;note?:string};
export const legacyProjectApiCrosswalk:readonly Binding[]=[
 {section:"summary",legacy:"getWorkspace",method:"GET",endpoint:""},
 {section:"summary",legacy:"updateWorkspace",method:"PATCH",endpoint:"",
  note:"Summary-only fields; nested sections are independently versioned"},
 {section:"overview",legacy:"getProjectBrief",method:"GET",endpoint:"",
  note:"Read-only workspace projection contains authored overview"},
 {section:"overview",legacy:"saveProjectBrief",method:"PATCH",endpoint:"/brief"},
 {section:"team",legacy:"listMembers",method:"GET",endpoint:"/members"},
 {section:"team",legacy:"addMember",method:"POST",endpoint:"/members"},
 {section:"releases",legacy:"createRelease",method:"POST",endpoint:"/releases"},
 {section:"sprints",legacy:"createSprint",method:"POST",endpoint:"/sprints"},
 {section:"tasks",legacy:"getTaskList",method:"GET",endpoint:"/tasks/list",
  note:"Supports lane, priority, assigneeId and sprintScope query filters"},
 {section:"tasks",legacy:"createTask",method:"POST",endpoint:"/tasks"},
 {section:"resources",legacy:"getResources",method:"GET",endpoint:"/resources"},
 {section:"resources",legacy:"createResource",method:"POST",endpoint:"/resources"},
 {section:"meetings",legacy:"listMeetings",method:"GET",endpoint:"/meetings"},
 {section:"meetings",legacy:"createMeeting",method:"POST",endpoint:"/meetings"},
 {section:"meetings",legacy:"updateMeetingPlan",method:"PUT",endpoint:"/meetings",
  note:"Current version and CSRF origin checks required"},
 {section:"readiness",legacy:"getReadiness",method:"GET",endpoint:"/readiness"},
 {section:"activity",legacy:"getActivityFeed",method:"GET",endpoint:"/activity",
  note:"fromDate/toDate use an inclusive IST start day and exclusive next IST midnight"},
 {section:"delivery",legacy:"getSubmission",method:"GET",endpoint:"/submission"},
 {section:"delivery",legacy:"updateSubmission",method:"PUT",endpoint:"/submission",
  note:"Only latest DRAFT, with version, submissionId and optimistic edit token"},
 {section:"delivery",legacy:"getSubmissionHistory",method:"GET",endpoint:"/submission/history"},
 {section:"delivery",legacy:"getDeliveryHistory",method:"GET",endpoint:"/delivery/history"},
 {section:"delivery",legacy:"reviewSubmission",method:"POST",endpoint:"/submission/review"},
 {section:"delivery",legacy:"createDeliveryDraft",method:"POST",endpoint:"/submissions"},
] as const;
export function projectLegacyCompatibilityRoutes(projectId:string){
 const base="/api/projects/"+encodeURIComponent(projectId);
 return legacyProjectApiCrosswalk.map(row=>({
  ...row,url:base+row.endpoint,
 }));
}
/** Sidebar order is role-dependent. The allocation board is a vNext Mentor
 * extension; it must not replace the old Admin Tasks/Delivery presentation.
 */
export const legacyProjectSectionOrder:Readonly<Record<"ADMIN"|"MENTOR"|"LEARNER",readonly WorkspaceLegacySection[]>>={
 ADMIN:["summary","overview","team","releases","sprints","tasks","resources",
   "meetings","readiness","delivery","activity"],
 MENTOR:["overview","team","releases","sprints","tasks","resources",
   "meetings","delivery","activity"],
 LEARNER:["overview","tasks","resources","meetings","delivery","activity"],
};
