import { redirect } from "next/navigation";

/** Preserve old Mentor course bookmarks without selecting an unauthorized course. */
export default function MentorLegacyCourseRedirect() {
  redirect("/mentor/projects");
}
