import {redirect} from "next/navigation";

/** MEN-projects-meetings-74: legacy mentor bookmark compatibility. */
export default function MentorLegacyRedirect(){
  redirect("/mentor");
}
