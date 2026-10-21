import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { Alert, Button, Skeleton } from "antd";
import PlacementsTabsLayout from "@/layouts/PlacementsTabsLayout";
import AnnouncementList from "@/components/tpo/announcements/AnnouncementList";
import { getPlacementOverview, getStudentAnnouncements } from "@/api/Services/TpoHubService";
import { relativeDay } from "@/components/Placements/student/words";

/**
 * Notices (redesign, 14 Oct 2026): the placement cell's announcements, and updates about the student's own placements (rounds,
 * offers, applications, requests), each opening the page where they act on it. The updates were a third list on Placement cell that
 * repeated the announcements and the bell; an announcement now shows once, under Announcements.
 */
export default function MyPlacementNotices() {
  const router = useRouter();
  const learnerId = useSelector((state) => state.loginUser?.id);
  const [items, setItems] = useState(null);
  const [updates, setUpdates] = useState(null);
  const [error, setError] = useState(false);
  const tab = router.query.show === "updates" ? "updates" : "announcements";
  const setTab = (t) => router.replace({ pathname: router.pathname, query: t === "announcements" ? {} : { show: t } }, undefined, { shallow: true });

  useEffect(() => { if (router.isReady && !learnerId) router.replace("/"); }, [router, router.isReady, learnerId]);

  const load = useCallback(() => {
    setItems(null);
    setUpdates(null);
    setError(false);
    getStudentAnnouncements()
      .then((res) => {
        setItems(Array.isArray(res?.data) ? res.data : []);
        // Opening the list marks them read: the tab's count goes with it.
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("placement-announcements-read"));
      })
      .catch(() => { setError(true); setItems([]); });
    getPlacementOverview()
      .then((res) => setUpdates((Array.isArray(res?.data?.notices) ? res.data.notices : []).filter((n) => n.event !== "PLACEMENT_ANNOUNCEMENT")))
      .catch(() => { setError(true); setUpdates([]); });
  }, []);
  useEffect(() => { if (learnerId) load(); }, [learnerId, load]);

  if (!learnerId) return null;
  return (
    <div data-testid="learner.announcements">
      <div className="sp-seg" role="group" aria-label="Show">
        <button type="button" aria-pressed={tab === "announcements"} onClick={() => setTab("announcements")}>Announcements</button>
        <button type="button" aria-pressed={tab === "updates"} onClick={() => setTab("updates")}>Updates about you{updates?.length ? ` (${updates.length})` : ""}</button>
      </div>
      {error && <Alert type="error" showIcon message="Couldn't load everything" action={<Button size="small" onClick={load}>Retry</Button>} className="sp-gap" />}
      {tab === "announcements" ? (
        <section className="sp-panel">
          <AnnouncementList mode="student" items={items} loading={items === null} highlightId={router.query.a}
            emptyText="No announcements from your placement cell yet." />
        </section>
      ) : (
        <section className="sp-panel" aria-label="Updates about you">
          {updates === null ? <Skeleton active paragraph={{ rows: 4 }} /> : updates.length === 0 ? (
            <p className="sp-empty">No updates yet. When a round is booked, an offer comes in or your application moves, it shows here.</p>
          ) : (
            <ul className="sp-notices">
              {updates.map((n) => (
                <li key={n.id} className="sp-notices__item">
                  <div>
                    <span className="sp-notices__title">{n.link ? <Link href={n.link}>{n.title}</Link> : n.title}</span>
                    <span className="sp-notices__body">{n.body}</span>
                  </div>
                  <time className="sp-muted sp-small">{relativeDay(n.createdAt)}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

MyPlacementNotices.getLayout = (page) => PlacementsTabsLayout(page);
