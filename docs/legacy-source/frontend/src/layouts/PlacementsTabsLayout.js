import { ConfigProvider } from "antd";
import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";

import { placementsTabList } from "@/common/lists";
import placementsTheme from "@/layouts/placementsTheme";
import PageShell from "@/components/Common/PageShell";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { accountScopeKey } from "@/utils/accountScopeKey";
import { useSwipeNav } from "@/hooks/useSwipeNav";
import { getStudentAnnouncementsUnread } from "@/api/Services/TpoHubService";

function PlacementsTabsLayout(page) {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const pathname = router.pathname || "";

  const activeKey = useMemo(() => {
    if (pathname.includes("/my-placements/jobs")) return "2";
    if (pathname.includes("/my-placements/applications")) return "3";
    if (pathname.includes("/my-placements/schedule")) return "4";
    if (pathname.includes("/my-placements/offers")) return "5";
    if (pathname.includes("/my-placements/announcements")) return "6";
    if (pathname.includes("/my-placements/placement") || pathname.includes("/my-placements/rules")) return "7";
    return "1"; // Home (/my-placements)
  }, [pathname]);

  // Track navigation direction for slide animation
  const prevKeyRef = useRef(activeKey);
  const [slideDirection, setSlideDirection] = useState(null);

  useEffect(() => {
    const prev = prevKeyRef.current;
    if (prev !== activeKey) {
      setSlideDirection(Number(activeKey) > Number(prev) ? "left" : "right");
      prevKeyRef.current = activeKey;
    }
  }, [activeKey]);

  const handleTabChange = useCallback((key) => {
    const targetTab = placementsTabList.find(tab => tab.key === key) ?? placementsTabList[0];
    const basePath = "/learn/my-placements";
    const newPath = targetTab.path ? `${basePath}/${targetTab.path}` : basePath;
    router.push(newPath);
  }, [router]);

  // Swipe navigation — find prev/next tab
  const currentIndex = placementsTabList.findIndex(t => t.key === activeKey);

  const goNext = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < placementsTabList.length) {
      handleTabChange(placementsTabList[nextIdx].key);
    }
  }, [currentIndex, handleTabChange]);

  const goPrev = useCallback(() => {
    const prevIdx = currentIndex - 1;
    if (prevIdx >= 0) {
      handleTabChange(placementsTabList[prevIdx].key);
    }
  }, [currentIndex, handleTabChange]);

  const swipeRef = useSwipeNav({
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  });

  const slideClass = slideDirection ? `placements-slide--${slideDirection}` : "";

  // Announcements V2: the tab says how many are new; it clears when the list is opened (the page fires the event).
  const [announcementsNew, setAnnouncementsNew] = useState(0);
  useEffect(() => {
    if (!loginUser?.id) return undefined;
    let gone = false;
    const refresh = () => getStudentAnnouncementsUnread().then((r) => { if (!gone) setAnnouncementsNew(Number(r?.data?.unread) || 0); }).catch(() => {});
    refresh();
    window.addEventListener("placement-announcements-read", refresh);
    return () => { gone = true; window.removeEventListener("placement-announcements-read", refresh); };
  }, [loginUser?.id]);

  const tabs = placementsTabList.map(tab => ({
    key: tab.key,
    label: tab.path === "announcements" && announcementsNew > 0 ? `${tab.label} (${announcementsNew})` : tab.label,
    href: tab.path ? `/learn/my-placements/${tab.path}` : "/learn/my-placements",
    active: tab.key === activeKey,
  }));

  // PageShell is the single shared frame (see src/components/Common/PageShell.jsx) — Placements
  // renders the exact same component Course and Projects do, not a hand-copied lookalike. This
  // was the module still using the old underlined AntD Tabs style and a scoped serif heading
  // font; both are gone now that it's the same component as everywhere else.
  return (
    <ConfigProvider theme={placementsTheme}>
      <div className="scroll-container learn-projects learn-placements-layout learn-course-layout">
        <PageShell
          title="My Placements"
          ariaLabel="Placements workspace"
          tabs={tabs}
          tabsAriaLabel="Placements sections"
        >
          <div
            ref={swipeRef}
            key={`${activeKey}:${accountScopeKey(loginUser)}`}
            className={`placements-page-content ${slideClass}`}
          >
            {page}
          </div>
        </PageShell>
      </div>
    </ConfigProvider>
  );
}

export default PlacementsTabsLayout;
