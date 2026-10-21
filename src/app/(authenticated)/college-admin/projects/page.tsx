import { redirect } from "next/navigation";
import { projectAdminDefaultHref } from "@/modules/projects/project-admin-navigation-model";

/** Legacy college-admin Projects index now opens vNext Workspaces directly. */
export default function LegacyCollegeAdminProjectsRedirect(){
  redirect(projectAdminDefaultHref("/college/projects"));
}
