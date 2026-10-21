import { redirect } from "next/navigation";

/** Accept every historical identifier (numeric, slug, invalid or removed).
 * The legacy route never read a group: its destination was always People.
 */
export default function LegacyCollegeStudentGroupDetailPage(){
  redirect("/college/people");
}
