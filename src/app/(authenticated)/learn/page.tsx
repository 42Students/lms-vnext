import { redirect } from "next/navigation";

/** Learner account root aliases to the one authorized Courses directory. */
export default function LearnerRootPage() {
  redirect("/learn/courses");
}
