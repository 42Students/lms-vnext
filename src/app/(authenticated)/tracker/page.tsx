import { redirect } from "next/navigation";

/** The tracker landing is the issues list; its own page enforces the Super Admin and runtime gates. */
export default function TrackerIndexPage() {
  redirect("/tracker/issues");
}
