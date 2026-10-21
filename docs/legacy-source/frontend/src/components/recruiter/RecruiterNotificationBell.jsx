import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Badge, Button, Drawer } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { momentFromApi } from "@/utils/placementDateTime";
import { getRecruiterNotifications, getRecruiterNotificationsUnread, markRecruiterNotificationsRead } from "@/api/Services/RecruiterService";
import { ListSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import { PanelEmpty, PanelError, PanelPartial } from "@/components/Common/PanelStates";

/**
 * The recruiter's bell: replies and what the placement cell did on their drives.
 * The badge is refreshed every 30 seconds with one number (not the whole feed), and only while the tab is in view.
 * The feed itself is fetched when the panel opens; items that arrived since the last look are marked as new, then everything is read.
 */
export default function RecruiterNotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [feed, setFeed] = useState(null);
  const [unread, setUnread] = useState(0);
  // BE-0137: unread notifications older than the 40 shown. While there are any, opening the bell doesn't mark everything
  // read (that would swallow ones never seen); "Mark all read" does it on purpose.
  const [hiddenUnread, setHiddenUnread] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [readError, setReadError] = useState(false);
  const countOnly = useRef(true); // false once the server is known not to have the count-only call (a deploy window)

  const loadCount = useCallback(async () => {
    if (countOnly.current) {
      try {
        const res = await getRecruiterNotificationsUnread();
        const nextUnread = Number(res?.data?.unread);
        if (!Number.isFinite(nextUnread) || nextUnread < 0) throw new Error("Invalid unread response");
        setUnread(nextUnread);
        return;
      } catch (e) {
        if (e?.response?.status !== 404) return;
        countOnly.current = false;
      }
    }
    try {
      const res = await getRecruiterNotifications();
      const nextUnread = Number(res?.data?.unread);
      if (!Number.isFinite(nextUnread) || nextUnread < 0) throw new Error("Invalid unread response");
      setUnread(nextUnread);
    } catch (_) { /* the badge keeps its last number */ }
  }, []);

  useEffect(() => {
    loadCount();
    const tick = () => { if (document.visibilityState !== "hidden") loadCount(); };
    const timer = setInterval(tick, 30000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [loadCount]);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getRecruiterNotifications();
      if (!Array.isArray(res?.data?.feed)) throw new Error("Invalid notification feed response");
      const nextUnread = Number(res?.data?.unread);
      if (!Number.isFinite(nextUnread) || nextUnread < 0) throw new Error("Invalid notification unread response");
      setError(false);
      setFeed(res.data.feed);
      const total = Number(res?.data?.unreadTotal);
      setHiddenUnread(Number.isFinite(total) && total > nextUnread ? total - nextUnread : 0);
      return Number.isFinite(total) && total > nextUnread ? -1 : nextUnread;
    } catch (_) {
      setError(true);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  const openDrawer = async () => {
    setOpen(true);
    // Once a feed has loaded, keep it visible while checking for newer notifications.
    // Clearing it here made every reopen flash back to a generic loading state.
    setReadError(false);
    const fresh = await loadFeed();
    if (fresh > 0) { // -1: some unread are hidden, so nothing is marked read just by opening
      try {
        await markRecruiterNotificationsRead();
        setUnread(0);
        setReadError(false);
      } catch (_) {
        setReadError(true);
      }
    }
  };

  const retryMarkRead = async () => {
    try {
      await markRecruiterNotificationsRead();
      setUnread(0);
      setHiddenUnread(0);
      setReadError(false);
    } catch (_) {
      setReadError(true);
    }
  };

  return (
    <>
      <Badge count={unread} size="small" offset={[-2, 2]}>
        <Button className="recruiter-bell__button" icon={<BellOutlined aria-hidden="true" />} onClick={openDrawer} aria-label={unread ? `Notifications, ${unread} new` : "Notifications"} data-testid="recruiter.notification-bell" />
      </Badge>
      <Drawer className="recruiter-bell__panel" title="Notifications" open={open} onClose={() => setOpen(false)} width={400}>
        {readError ? (
          <Alert type="warning" showIcon message="Notifications loaded, but read status could not be saved" action={<Button size="small" onClick={retryMarkRead}>Retry</Button>} style={{ marginBottom: 12 }} />
        ) : null}
        {error && !feed ? (
          <PanelError
            compact
            title="Couldn't load your notifications"
            description="Your notification feed could not be loaded."
            onRetry={loadFeed}
          />
        ) : !feed ? (
          <ListSkeleton rows={4} avatar={false} label="Loading recruiter notifications" />
        ) : (
          <>
            {loading && <RefreshStatus label="Refreshing notifications…" />}
            {error && (
              <PanelPartial
                compact
                title="Couldn't refresh your notifications"
                description="Showing the last notifications we loaded."
                onRetry={loadFeed}
                retryLabel="Retry"
              />
            )}
            {hiddenUnread > 0 && (
              <div className="tpo-bell-panel__older" data-testid="recruiter.bell.older-unread">
                {hiddenUnread} older unread {hiddenUnread === 1 ? "notification isn't" : "notifications aren't"} shown here; your drives have them.{" "}
                <button type="button" className="tpo-bell-panel__mark" onClick={retryMarkRead}>Mark all read</button>
              </div>
            )}
            {feed.length === 0 ? (
              <PanelEmpty
                compact
                icon={BellOutlined}
                title="Nothing yet"
                description="Replies and drive decisions will show up here."
              />
            ) : (
              <ul className="tpo-bell-panel__list" data-testid="recruiter.bell.list">
                {feed.map((n) => (
                  <li key={n.id}>
                    <button type="button" className={`tpo-bell-panel__item${n.isNew ? " is-new" : ""}`} disabled={!n.link}
                      onClick={() => { setOpen(false); onNavigate?.(n.link); }}>
                      {n.isNew && (
                        <>
                          <span className="tpo-bell-panel__dot" aria-hidden="true" />
                          <span className="sr-only">New notification. </span>
                        </>
                      )}
                      <span className="tpo-bell-panel__title">{n.title}</span>
                      {n.body && <span className="tpo-bell-panel__body">{n.body}</span>}
                      <span className="tpo-bell-panel__when">{momentFromApi(n.createdAt).fromNow()}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Drawer>
    </>
  );
}
