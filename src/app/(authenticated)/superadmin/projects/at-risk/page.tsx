import {redirect} from "next/navigation";
/** Legacy project menu alias; the selected college scope stays in the session. */
export default function LegacySuperAdminAtRisk(){redirect("/admin/projects/at-risk");}
