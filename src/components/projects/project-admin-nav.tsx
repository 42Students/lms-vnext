import Link from "next/link";

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

  return (
    <nav
      aria-label="Projects"
      className="mb-6 flex gap-2 overflow-x-auto border-b border-border"
    >
      {PROJECT_ADMIN_LINKS.map(
        ([suffix, label]) => (
          <Link
            key={suffix || "workspaces"}
            href={basePath + suffix}
            aria-current={
              suffix === activePath
                ? "page"
                : undefined
            }
            className={
              "whitespace-nowrap border-b-[3px] px-3 py-2 text-[14px] font-semibold transition " +
              (suffix === activePath
                ? "border-primary text-primary-text"
                 : "border-transparent text-body hover:bg-primary-subtle hover:text-primary-text")
            }
          >
            {label}
          </Link>
        ),
      )}
    </nav>
  );
}
