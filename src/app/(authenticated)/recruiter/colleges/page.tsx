import {redirect} from "next/navigation";
/** Legacy college selector returns to recruiter Today; access selection stays scoped there. */
export default function RecruiterColleges(){redirect("/recruiter/home");}
