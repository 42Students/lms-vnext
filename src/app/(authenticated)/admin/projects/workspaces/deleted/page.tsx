import { redirect } from "next/navigation";

/** Legacy Super Admin deleted-workspaces destination. Data and access checks
 * remain owned by the canonical selected-college deleted-workspaces view. */
export default function LegacyDeletedWorkspacesPage() {
  redirect("/admin/projects/deleted");
}
