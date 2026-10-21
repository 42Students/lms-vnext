import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import DashboardPage from "../../dashboard/page";

/** Bookmark-compatible view at the original legacy destination.
 * No second platform workspace is created; this renders the existing
 * role-aware dashboard only for a currently authorized Super Admin.
 */
export default async function LegacySuperAdminDashboardPage(){
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context))redirect("/dashboard");
 return DashboardPage();
}
