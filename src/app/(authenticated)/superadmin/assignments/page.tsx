import {redirect} from "next/navigation";

/** Old LMS Super Admin assignments bookmark; maintain selected admin scope. */
export default function LegacySuperAdminAssignmentsRedirect(){
 redirect("/admin/assignments");
}
