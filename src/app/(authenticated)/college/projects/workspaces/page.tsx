import { redirect } from "next/navigation";

/** Canonical College Admin Workspaces list is /college/projects. */
export default function LegacyCollegeWorkspacesRedirect() {
  redirect("/college/projects");
}
