import {redirect} from "next/navigation";
/** Old LMS project workspace creation URL, preserved as a safe alias. */
export default function LegacyCollegeWorkspaceCreatePage(){
  redirect("/college/projects/create");
}
