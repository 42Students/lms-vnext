import React from "react";
import { useRouter } from "next/router";
import PageShell from "@/components/Common/PageShell";
import { projectTabs } from "@/data/projectsData";

/*
  PM-18: this carried `role="tablist"` over plain <Link>s that had no `role="tab"`, no
  `aria-selected`, no `aria-controls` and no roving tabindex. ARIA is a contract: declaring
  a tablist promises assistive tech that its children are tabs, that arrow keys will move
  between them, and that one is selected. None of that was true, so a screen reader
  announced "tab list" and then found ZERO tabs inside it — strictly worse than no ARIA at
  all, because it replaces a correct description (a list of links) with a false one.

  These genuinely ARE links: each one navigates to its own URL, is independently
  addressable, opens in a new tab with ctrl-click, and appears in browser history. That is
  navigation, not a tab widget — so the honest markup is a <nav> containing a list of
  links, which is what PageShell's `tabs` prop renders. `active` (below) drives
  `aria-current="page"` the same way it always did.
*/
function ProjectsShell({ title, subtitle, activeTab = "overview", tabProjectId, fallbackProjectId, actions, children, showTabs = true, hiddenTabKeys = [] }) {
  const router = useRouter();
  const activeProjectId = router.query.projectId;
  const isMentor = router.pathname?.startsWith("/mentor");
  const basePath = isMentor ? "/mentor/projects" : "/learn/projects";

  const tabs = showTabs
    ? projectTabs
        .filter((tab) => !hiddenTabKeys.includes(tab.key))
        .map((tab) => {
          const targetProjectId = tabProjectId || activeProjectId || fallbackProjectId;
          return {
            key: tab.key,
            label: tab.label,
            href: targetProjectId
              ? `${basePath}/${encodeURIComponent(targetProjectId)}?tab=${tab.key}`
              : `${basePath}?tab=${tab.key}`,
            active: tab.key === activeTab,
          };
        })
    : [];

  return (
    <div className="scroll-container learn-projects">
      <PageShell
        title={title}
        subtitle={subtitle}
        actions={actions}
        ariaLabel="Projects workspace"
        tabs={tabs}
        tabsAriaLabel="Project sections"
      >
        {children}
      </PageShell>
    </div>
  );
}

export default ProjectsShell;
