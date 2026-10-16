import { redirect } from "next/navigation";

/** Legacy People Directory is the read-only college contact lookup.
 * Account administration is available at /college/people/manage. */
export default function CollegePeoplePage() {
  redirect("/college/contacts");
}
