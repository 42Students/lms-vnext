import { Tabs } from "@/components/ui/tabs";

const PROJECT_ADMIN_LINKS = [
  ["", "Workspaces"],
  ["/at-risk", "At Risk"],
  ["/readiness", "Readiness"],
  ["/submissions", "Submissions"],
  ["/templates", "Templates"],
  ["/audit", "Audit"],
] as const;

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

  return <Tabs ariaLabel="Projects" renderPanel={false} value={activePath}
    items={PROJECT_ADMIN_LINKS.map(([suffix,label])=>({
      value:suffix,
      label,
      href:basePath+suffix,
    }))}/>;
}
