import {redirect} from "next/navigation";

/** Preserve the old Super Admin Activity Log bookmark. */
export default function LegacySuperAdminAuditRedirect(){
 redirect("/admin/audit");
}
