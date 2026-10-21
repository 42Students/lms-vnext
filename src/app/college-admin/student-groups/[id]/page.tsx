import { redirect } from "next/navigation";

/** Historical group details were hidden and redirected to People. */
export default function LegacyStudentGroupDetailPage() {
  redirect("/college/people");
}
