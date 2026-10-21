import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { contactsTabList } from "@/common/lists";
import PageShell from "@/components/Common/PageShell";
import { getFacultyBasePath } from "@/utils/facultyRouteUtils";

// Was its own hand-built `ln-module-card learn-placements-dashboard__card` wrapper with antd
// <Tabs> driving navigation through a redux-stored tab index — the one page in the app still on
// that older pattern. Every other tabbed page (Course, Projects, Placements) shares PageShell's
// pill tabs instead, derived straight from the URL rather than round-tripped through redux
// (avoids the "highlights the previous tab for a frame" class of bug CourseTabsLayout's own
// comments describe from when it worked the same way).
function ContactsTabLayout(page) {
  const router = useRouter();
  const { contactsTab } = router.query;

  const roleBase = `${getFacultyBasePath(router.pathname)}/contacts`;

  const tabs = useMemo(
    () =>
      contactsTabList.map((tab) => ({
        key: tab.key,
        label: tab.label,
        href: `${roleBase}/${tab.path}`,
        active: tab.path === contactsTab,
      })),
    [roleBase, contactsTab]
  );

  return (
    // `.learn-projects` was missing here — PageShell's own child classes (`.learn-projects__shell`'s
    // padding, `.learn-projects__tabs`/`.learn-projects__tab`'s pill styling, `.learn-projects__content`'s
    // spacing) are all SCSS-nested *inside* a `.learn-projects` ancestor in _learn-projects.scss, not
    // styled standalone — PageShell.jsx itself never renders that ancestor class, it's the caller's
    // job to supply it (see ProjectsShell.jsx, the pattern PageShell was extracted from). Without it,
    // this page silently fell back to a smaller global padding default and fully unstyled tab pills —
    // not a "PageShell isn't being used" bug so much as "PageShell was used without its required wrapper".
    // `.learn-notifications-page--scroll` was dropped too: grepped with zero matching CSS anywhere, a
    // phantom class from before this page's own migration.
    <div className="scroll-container learn-contacts-page learn-projects learn-placements-dashboard">
      <PageShell
        title="Contacts"
        ariaLabel="Contacts directory"
        tabs={tabs}
        tabsAriaLabel="Contacts sections"
      >
        <section className="learn-contacts-grid-section" aria-label="Contacts list">
          {page}
        </section>
      </PageShell>
    </div>
  );
}

export default ContactsTabLayout;
