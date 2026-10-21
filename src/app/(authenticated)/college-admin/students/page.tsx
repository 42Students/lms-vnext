import { redirect } from "next/navigation";

/** Preserve legacy College Admin student bookmarks within the role workspace. */
export default function LegacyCollegeStudentsPage() {
  redirect("/college/students");
}
