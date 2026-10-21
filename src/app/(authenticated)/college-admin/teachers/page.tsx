import { redirect } from "next/navigation";

/** Preserve legacy College Admin faculty bookmarks within the role workspace. */
export default function LegacyCollegeTeachersPage() {
  redirect("/college/faculty");
}
