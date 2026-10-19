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
      aria-label="Project template sections" tabIndex={0} className="overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,black_90%,transparent_100%)] border-b border-border focus-visible:outline-2 focus-visible:outline-[var(--lms-teal-deep)]"
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
                ? "inline-flex min-h-9 items-center border-b-[3px] border-primary bg-primary-subtle px-4 text-[14px] font-[650] text-primary-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
                : "inline-flex min-h-9 items-center border-b-[3px] border-transparent px-4 text-[14px] font-[650] text-body hover:bg-primary-subtle hover:text-[var(--lms-teal-deep)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
