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
  {label:"Placement eligibility",href:"/tpo/batches",description:"Check student eligibility, batches and placement participation."},
  {label:"Requests",href:"/tpo/requests",description:"What students asked you to decide: withdrawals, off-campus offers, registration changes"},
  {label:"Calendar",href:"/tpo/calendar",description:"Talks, deadlines and rounds"},
  {label:"Announcements",href:"/tpo/announcements",description:"Share placement updates with students"},
  {label:"Messages",href:"/tpo/messages",description:"Your placement conversations"},
  {label:"Placement team",href:"/tpo/team",description:"Manage your placement team"},
 ]},
 {heading:"Insights",description:"Placement reports",links:[
  {label:"Reports",href:"/tpo/reports",description:"Placement summary, by branch, by company and more"},
 ]},
 {heading:"Account",description:"Your account and notifications",links:[
  {label:"Notifications",href:"/tpo/notifications",description:"Everything that has notified you"},
  {label:"Settings",href:"/tpo/settings",description:"Placement settings and preferences"},
  {label:"Audit log",href:"/tpo/audit",description:"Who did what, and when"},
  {label:"Profile",href:"/tpo/profile",description:"Your own account details"},
 ]},
] as const;

export function formatTpoProfileRole(
  role: string,
): string {
  if (role === "TPO") return "TPO";

  return role
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}
