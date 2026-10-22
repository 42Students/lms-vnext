import { redirect } from "next/navigation";

/** Keep old faculty bookmarks working while the file explorer lives in Courses. */
export default function LegacyTeacherFileExplorerPage() {
  redirect("/teacher/courses");
}
