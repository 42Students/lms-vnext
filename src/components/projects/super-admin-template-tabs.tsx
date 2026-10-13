import Link from "next/link";
import {
  TEMPLATE_SUBVIEW_TABS,
  templateSubviewHref,
  type TemplateSubview,
} from "@/modules/projects/template-subview-model";

export function SuperAdminTemplateTabs({
  templateId,
  active,
}: {
  templateId: string;
  active: TemplateSubview;
}) {
  return (
    <nav
      aria-label="Project template sections"
      className="overflow-x-auto border-b border-border pb-3"
    >
      <div className="flex min-w-max gap-2">
        {TEMPLATE_SUBVIEW_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={templateSubviewHref(
              templateId,
              tab.id,
            )}
            aria-current={
              active === tab.id
                ? "page"
                : undefined
            }
            className={
              active === tab.id
                ? "inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
                : "inline-flex min-h-10 items-center rounded-lg px-4 text-sm font-semibold text-body hover:bg-primary-subtle hover:text-primary-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
