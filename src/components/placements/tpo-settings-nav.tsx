import Link from "next/link";

const SETTINGS_LINKS = [
  {
    id: "season",
    label: "Placement Season",
    href: "/tpo/settings/season",
  },
  {
    id: "rules",
    label: "Placement Rules",
    href: "/tpo/settings/rules",
  },
  {
    id: "team",
    label: "Placement Team",
    href: "/tpo/settings/team",
  },
  {
    id: "trusted",
    label: "Trusted Companies",
    href: "/tpo/settings/trusted",
  },
] as const;

export function TpoSettingsNav({
  active,
}: {
  active: "season" | "rules" | "team" | "trusted";
}) {
  return (
    <nav
      aria-label="TPO placement settings sections"
      className="overflow-x-auto border-b border-border pb-3"
    >
      <div className="flex min-w-max gap-2">
        {SETTINGS_LINKS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-current={
              active === item.id
                ? "page"
                : undefined
            }
            className={
              active === item.id
                ? "inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary"
                : "inline-flex min-h-10 items-center rounded-lg px-4 text-sm font-semibold text-body hover:bg-primary-subtle hover:text-primary-text"
            }
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
