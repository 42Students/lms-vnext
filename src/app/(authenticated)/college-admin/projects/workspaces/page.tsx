import { redirect } from "next/navigation";
import { projectAdminDefaultHref } from "@/modules/projects/project-admin-navigation-model";

export default function LegacyCollegeAdminWorkspacesRedirect(){
  redirect(projectAdminDefaultHref("/college/projects"));
}
