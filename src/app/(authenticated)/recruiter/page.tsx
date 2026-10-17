import {redirect} from "next/navigation";
/** Preserve the legacy recruiter entrypoint while using the canonical Today workspace. */
export default function RecruiterIndex(){redirect("/hr/home");}
