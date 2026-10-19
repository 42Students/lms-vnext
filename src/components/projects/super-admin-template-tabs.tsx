import { Tabs } from "@/components/ui/tabs";
import styles from "./legacy-project-tabs.module.css";
import {
  TEMPLATE_SUBVIEW_TABS,
  templateSubviewHref,
  type TemplateSubview,
} from "@/modules/projects/template-subview-model";

/** Shared legacy underline tabs; counts are displayed only when already loaded. */
export function SuperAdminTemplateTabs({
  templateId,
  active,
  counts,
}: {
  templateId: string;
  active: TemplateSubview;
  counts?: Partial<Record<TemplateSubview, number>>;
}) {
  return <Tabs className={styles.legacy} ariaLabel="Project template sections" value={active} renderPanel={false}
    items={TEMPLATE_SUBVIEW_TABS.map(tab=>({
      value:tab.id,
      label:tab.label,
      href:templateSubviewHref(templateId,tab.id),
      count:counts?.[tab.id],
    }))}/>;
}
