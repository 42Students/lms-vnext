import {redirect} from "next/navigation";
/** Legacy GET /superadmin formerly returned HTTP 302 to
 * /superadmin/dashboard. This App Router page uses a temporary redirect
 * (307), which preserves the method and replaces client-side navigation.
 * The visible destination remains identical to legacy, while the dedicated
 * destination rechecks platform scope before rendering the modern dashboard.
 */
export default function LegacySuperAdminRoot(){
 redirect("/superadmin/dashboard");
}
