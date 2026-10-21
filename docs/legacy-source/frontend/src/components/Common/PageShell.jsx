import React, { useEffect, useId, useRef } from "react";
import Link from "next/link";
import CourseSectionHeader from "@/components/Course/Common/CourseSectionHeader";

/** Shared content shell; long tab strips stay discoverable at narrow widths and zoom levels. */
function PageShell({
  title,
  subtitle,
  actions,
  ariaLabel,
  tabs,
  tabsAriaLabel = "Sections",
  contentClassName = "",
  children,
}) {
  const tabsRef = useRef(null);
  const overflowHintId = useId();
  const activeKey = Array.isArray(tabs) ? tabs.find((tab) => tab.active)?.key : null;

  useEffect(() => {
    const nav = tabsRef.current;
    const active = nav?.querySelector('[aria-current="page"]');
    if (!nav || !active) return;
    // Scroll only the tab strip, not the entire page, when a deep-linked tab is off-screen.
    const viewport = nav.getBoundingClientRect();
    const selected = active.getBoundingClientRect();
    if (selected.left < viewport.left) nav.scrollLeft -= viewport.left - selected.left + 8;
    else if (selected.right > viewport.right) nav.scrollLeft += selected.right - viewport.right + 8;
  }, [activeKey]);

  const handleTabsKeyDown = (event) => {
    const nav = tabsRef.current;
    if (!nav || event.target !== nav) return;
    const page = Math.max(Math.floor(nav.clientWidth * 0.8), 160);
    if (event.key === "ArrowRight") {
      event.preventDefault();
      nav.scrollLeft += page;
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      nav.scrollLeft -= page;
    } else if (event.key === "Home") {
      event.preventDefault();
      nav.scrollLeft = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      nav.scrollLeft = nav.scrollWidth;
    }
  };

  return (
    <div className="ln-module-card learn-projects__shell">
      {title && (
        <CourseSectionHeader
          title={title}
          subtitle={subtitle}
          actions={actions}
          ariaLabel={ariaLabel || title}
          headingLevel={1}
        />
      )}

      {Array.isArray(tabs) && tabs.length > 0 && (
        <>
        {tabs.length > 6 && (
          <span id={overflowHintId} className="sr-only">
            This section navigation scrolls horizontally. Tab through the links, or focus this navigation region and use horizontal scrolling controls.
          </span>
        )}
        <nav ref={tabsRef} className="learn-projects__tabs" aria-label={tabsAriaLabel}
          aria-describedby={tabs.length > 6 ? overflowHintId : undefined}
          tabIndex={tabs.length > 6 ? 0 : undefined}
          onKeyDown={handleTabsKeyDown}
          style={tabs.length > 6 ? {
            overflowX: "auto", overscrollBehaviorX: "contain", scrollbarWidth: "thin",
            WebkitOverflowScrolling: "touch", flexWrap: "nowrap",
          } : undefined}>
          {tabs.map((tab) => (
            <Link key={tab.key} href={tab.href}
              className={`learn-projects__tab ${tab.active ? "learn-projects__tab--active" : ""}`}
              aria-current={tab.active ? "page" : undefined}>
              {tab.label}
            </Link>
          ))}
        </nav>
        </>
      )}

      <div className={`learn-projects__content ${contentClassName}`.trim()}>{children}</div>
    </div>
  );
}

export default PageShell;
