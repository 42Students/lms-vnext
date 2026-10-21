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
  // The College Admin shell already displays this Projects tab strip.
  // Super Admin must keep it here, including when no acting college has
  // been selected: hiding it removes the legacy recovery navigation.
  if (basePath === "/college/projects") return null;

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
