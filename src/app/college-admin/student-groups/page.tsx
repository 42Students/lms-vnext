import {redirect} from "next/navigation";
/** The legacy Student Groups entry was hidden and always routed to People.
 * New vNext group tools remain independently release-gated.
 */
export default function LegacyStudentGroupsAlias(){
  redirect("/college/people");
}
