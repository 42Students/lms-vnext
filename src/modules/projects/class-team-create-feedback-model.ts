/** Non-leaking, actionable copy for the class-team workspace create API boundary. */
export function classTeamCreationFeedback(error:unknown):string {
 const text=error instanceof Error?error.message:"";
 const code=text.trim().toUpperCase().replace(/[^A-Z0-9]+/g,"_").replace(/^_|_$/g,"");
 switch(code) {
  case "PROJECT_CLASS_ROSTER_STALE":
  case "CLASS_ROSTER_STALE":return "The class roster changed. Refresh the roster, review the teams, and create again.";
  case "PROJECT_TEAM_PREVIEW_STALE":return "The team preview changed. Review the team assignments and try again.";
  case "PROJECT_TEAM_PREVIEW_INVALID":return "Every current learner must belong to exactly one team. Review the preview.";
  case "PROJECT_TEAM_UNBALANCED":return "Team sizes must differ by at most one learner.";
  case "PROJECT_TEMPLATE_NOT_ASSIGNED":return "The selected template is no longer assigned. Choose an available template.";
  case "PROJECT_SLUG_CONFLICT":return "A Project workspace already uses this base slug. Choose another.";
  case "PROJECT_ACCESS_DENIED":return "You do not have permission to create workspaces for this college.";
  case "PROJECT_CLASS_ROSTER_UNSUPPORTED":return "This class roster cannot be split with the current limits.";
  case "PROJECT_CLASS_ROSTER_DUPLICATE":return "The class roster contains duplicate memberships. Ask an administrator to review enrollments.";
  default:return "Workspaces could not be created. Refresh the class and try again.";
 }
}
