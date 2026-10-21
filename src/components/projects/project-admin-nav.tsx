import { Tabs } from "@/components/ui/tabs";
import styles from "./legacy-project-tabs.module.css";
import { PROJECT_ADMIN_SECTIONS } from "@/modules/projects/project-admin-navigation-model";



export function ProjectAdminNav({
  basePath,
  active,
}: {
  basePath: string;
  active:
    | "workspaces"
    | "at-risk"
    | "readiness"
    | "submissions"
    | "templates"
    | "audit";
}) {
  // College Admin already has the identical legacy group strip in its layout.
  // Keep the shared Super Admin navigation, but never render two college strips.
  if (basePath === "/college/projects" || basePath === "/admin/projects") return null;

  const activePath =
    active === "workspaces"
      ? ""
      : "/" + active;

  return <Tabs className={styles.legacy} ariaLabel="Projects" renderPanel={false} value={activePath}
    items={PROJECT_ADMIN_SECTIONS.map(({suffix,label})=>({
      value:suffix,
      label,
      href:basePath+suffix,
    }))}/>;
}
