import {redirect} from "next/navigation";
/** Preserve legacy /superadmin bookmarks on the role-aware global dashboard.
 * Academic Setup is scoped to a selected college, unlike Overview. */
export default function LegacySuperAdminRoot(){redirect("/dashboard");}
