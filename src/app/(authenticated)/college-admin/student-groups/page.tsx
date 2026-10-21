import { redirect } from "next/navigation";

/** Old LMS Student Groups was intentionally hidden. This canonical alias
 * never queries or mutates groups and uses Next's server replace redirect.
 */
export default function LegacyCollegeStudentGroupsPage(){
  redirect("/college/people");
}
