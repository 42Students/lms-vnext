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
  const activePath =
    active === "workspaces"
      ? ""
      : "/" + active;

  return (
    <nav
      aria-label="Projects"
      className="mb-6 flex gap-2 overflow-x-auto border-b border-border pb-3"
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
              "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition " +
              (suffix === activePath
                ? "bg-primary text-primary-foreground"
                : "text-body hover:bg-muted hover:text-foreground")
            }
          >
            {label}
          </Link>
        ),
      )}
    </nav>
  );
}
