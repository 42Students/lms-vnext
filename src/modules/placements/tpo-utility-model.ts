/**
 * TPO secondary navigation.
 *
 * Every destination must have a working page in the
 * authenticated TPO route group. Companies uses the
 * existing recruiter companies view: /tpo/companies
 * requires a selected name and otherwise redirects.
 */
/** The eleven fixed legacy destinations. Every destination is an existing
 * authenticated TPO page; authorisation is enforced by its route and APIs. */
export const TPO_MORE_GROUPS = [
 {heading:"Work",description:"Placement workspaces",links:[
  {label:"Placement eligibility",href:"/tpo/batches",description:"Who is in placements, batch by batch"},
  {label:"Requests",href:"/tpo/requests",description:"What students asked you to decide: withdrawals, off-campus offers, registration changes"},
  {label:"Calendar",href:"/tpo/calendar",description:"Talks, deadlines and rounds"},
  {label:"Announcements",href:"/tpo/announcements",description:"Tell your students; read what 42 tells you"},
  {label:"Messages",href:"/tpo/messages",description:"Conversations with recruiters"},
  {label:"Placement team",href:"/tpo/settings?tab=team",description:"Who is on the team and who owns what"},
 ]},
 {heading:"Insights",description:"Placement reports",links:[
  {label:"Reports",href:"/tpo/reports",description:"Placement summary, by branch, by company and more"},
 ]},
 {heading:"Account",description:"Your account and notifications",links:[
  {label:"Notifications",href:"/tpo/notifications",description:"Everything that has notified you"},
  {label:"Settings",href:"/tpo/settings",description:"Rules, team, templates and branding"},
  {label:"Audit log",href:"/tpo/audit",description:"Who did what, and when"},
  {label:"Profile",href:"/tpo/profile",description:"Your own account details"},
 ]},
] as const;

/** Exact legacy TpoProfileCard role copy. The membership switcher
 * continues to use its own canonical role labels. */
export function formatTpoProfileRole(
  role: string,
): string {
  if (role === "TPO") return "Placement officer";
  if (role === "ADMIN" || role === "COLLEGE_ADMIN") return "College admin (acts as placement officer)";
  return "Placement team";
}
