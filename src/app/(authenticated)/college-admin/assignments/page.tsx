import {redirect} from "next/navigation";

/** Old LMS college assignment bookmark; authorization occurs at canonical page. */
export default function LegacyCollegeAssignmentsRedirect(){
 redirect("/college/assignments");
}
