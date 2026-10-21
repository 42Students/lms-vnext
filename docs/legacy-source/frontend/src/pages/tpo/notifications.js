import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { Alert, Button, Card, Empty, List, Segmented, Tag, Typography, message } from "antd";
import { dj } from "@/components/tpo/dj";
import PageShell from "@/components/Common/PageShell";
import { PanelError } from "@/components/Common/PanelStates";
import { ListSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { ArrowRightOutlined } from "@ant-design/icons";
import { bellRead, bellReadAll, getBell, getCounts } from "@/api/Services/TpoHubService";

// BE-0042: the feed is a window (newest first). It grows on "Show older" up to the server's ceiling, and the unread
// number comes from the server's own count, so "no unread" is never claimed from a partial window.
const PAGE = 50;
const MAX_FEED = 200;

/** The Bell (TPO V1 - Locked.docx §1): things that happened, for information. Things to do live on Home under "Needs you". */
export default function TpoNotifications() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const loadSeqRef = useRef(0);
  const [limit, setLimit] = useState(PAGE);
  const [serverUnread, setServerUnread] = useState(null);
  const markingRef = useRef(null);
  useEffect(() => { dispatch(appAction.setActiveMenuItem("notifications")); }, [dispatch]);
  // A failure used to become "Nothing yet" with no loading state at all, so loading and genuinely
  // empty were indistinguishable from a real failure.
  const load = useCallback(async () => {
    const requestId = ++loadSeqRef.current;
    setLoading(true);
    const [r, c] = await Promise.all([fetchWithErrorHandling(getBell(limit)), fetchWithErrorHandling(getCounts())]);
    if (requestId !== loadSeqRef.current) return;
    setLoading(false);
    setServerUnread(c.success && c.data && c.data.bell != null ? Number(c.data.bell) || 0 : null);
    if (!r.success) { setError(r?.data?.message || r?.data?.error || "Could not load notifications"); return; }
    setError(null);
    setRows(Array.isArray(r.data) ? r.data : []);
  }, [limit]);
  useEffect(() => { load(); }, [load]);
  const markAllRead = async () => {
    if (markingRef.current) return;
    markingRef.current = "all";
    setMarkingAll(true);
    try {
      const r = await fetchWithErrorHandling(bellReadAll());
      if (!r.success) { message.error(r?.data?.message || r?.data?.error || "Could not mark all as read"); return; }
      const readAt = new Date().toISOString();
      setRows((current) => current.map((row) => row.readAt ? row : { ...row, readAt }));
      setServerUnread(0);
    } finally {
      markingRef.current = null;
      setMarkingAll(false);
    }
  };

  // Opening a notification marks it read only after the backend accepts the change. Previously the
  // UI optimistically cleared "New" even when the write failed, creating a false read state.
  const openItem = async (n) => {
    if (markingRef.current) return;
    if (!n.readAt) {
      markingRef.current = n.id;
      setMarkingId(n.id);
      try {
        const r = await fetchWithErrorHandling(bellRead(n.id));
        if (!r.success) {
          message.error(r?.data?.message || r?.data?.error || "Could not mark this notification as read");
          return;
        }
        setRows((current) => current.map((row) => row.id === n.id ? { ...row, readAt: new Date().toISOString() } : row));
      } finally {
        markingRef.current = null;
        setMarkingId(null);
      }
    }
    if (n.link) router.push(n.link);
  };

  const shownUnread = rows.filter((r) => !r.readAt).length;
  // The server's count covers notifications older than the loaded window too.
  const unreadCount = serverUnread != null ? Math.max(serverUnread, shownUnread) : shownUnread;
  const windowFull = rows.length >= limit;
  const canShowOlder = windowFull && limit < MAX_FEED;
  const olderUnread = Math.max(0, unreadCount - shownUnread);
  const visibleRows = useMemo(() => (filter === "unread" ? rows.filter((r) => !r.readAt) : rows), [filter, rows]);
  const groupedRows = useMemo(() => {
    const groups = [];
    visibleRows.forEach((row) => {
      const when = dj(row.createdAt);
      const label = when.isSame(dj(), "day") ? "Today" : when.isSame(dj().subtract(1, "day"), "day") ? "Yesterday" : when.isAfter(dj().subtract(7, "day")) ? "This week" : "Earlier";
      let group = groups.find((g) => g.label === label);
      if (!group) { group = { label, rows: [] }; groups.push(group); }
      group.rows.push(row);
    });
    return groups;
  }, [visibleRows]);

  return (
    <div className="scroll-container tpo-notifications" data-testid="tpo.notifications">
      <PageShell>
        <ListingPageHeader
          className="tpo-notifications__header"
          title="Notifications"
          subtitle={<Typography.Text type="secondary">A clean history of what happened across placements. Actionable work stays on Home under Needs you.</Typography.Text>}
          rightContent={<Button className="tpo-notifications__mark-read" loading={markingAll} disabled={!unreadCount || markingAll || markingId != null} onClick={markAllRead}>Mark all as read</Button>}
        />

        {error && rows.length === 0 ? (
          <PanelError title={error} onRetry={load} />
        ) : loading && rows.length === 0 ? (
          <Card className="tpo-notifications__loading"><ListSkeleton rows={5} avatar={false} label="Loading placement notifications" /></Card>
        ) : (
          <>
            {loading && rows.length > 0 && <RefreshStatus label="Refreshing notifications…" />}
            <Card className="tpo-notifications__feed">
              <div className="tpo-notifications__feed-head">
                <Segmented
                  className="tpo-notifications__filter"
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: "all", label: windowFull ? `Latest ${rows.length}` : `All (${rows.length})` },
                    { value: "unread", label: `Unread (${unreadCount})` },
                  ]}
                />
              </div>

              {error && <Alert className="tpo-notifications__stale-alert" type="error" showIcon closable message="This refresh failed. Showing the last successful load." description={error} action={<Button size="small" onClick={load}>Retry</Button>} />}

              {visibleRows.length === 0 ? (
                <div className="tpo-notifications__empty">
                  <Empty description={filter === "unread" ? (olderUnread > 0 ? `No unread in the latest ${rows.length}. ${olderUnread} older unread: show older, or mark all as read.` : "No unread notifications") : "Nothing yet"} />
                </div>
              ) : (
                <div className="tpo-notifications__groups">
                  {groupedRows.map((group) => (
                    <section className="tpo-notifications__group" key={group.label}>
                      <Typography.Text className="tpo-notifications__group-label">{group.label}</Typography.Text>
                      <List
                        split={false}
                        dataSource={group.rows}
                        renderItem={(n) => (
                          <List.Item
                            className={`tpo-notifications__item ${!n.readAt ? "tpo-notifications__item--unread" : ""} ${n.link ? "tpo-notifications__item--linked" : ""}`}
                            onClick={() => openItem(n)}
                            aria-busy={Number(markingId) === Number(n.id)}
                          >
                            <span className="tpo-notifications__dot" aria-hidden="true" />
                            <List.Item.Meta
                              title={
                                <div className="tpo-notifications__item-title">
                                  <span>{n.title}</span>
                                  {!n.readAt && <Tag color="blue">New</Tag>}
                                </div>
                              }
                              description={
                                <div className="tpo-notifications__item-body">
                                  <Typography.Text>{n.body}</Typography.Text>
                                  <Typography.Text type="secondary">{dj(n.createdAt).format("D MMM, h:mm A")}</Typography.Text>
                                </div>
                              }
                            />
                            {n.link && <ArrowRightOutlined className="tpo-notifications__arrow" aria-hidden="true" />}
                          </List.Item>
                        )}
                      />
                    </section>
                  ))}
                </div>
              )}
              {(canShowOlder || (windowFull && olderUnread > 0)) && (
                <div className="tpo-notifications__older" data-testid="tpo.notifications.older">
                  {olderUnread > 0 && <Typography.Text type="secondary">{olderUnread} unread {olderUnread === 1 ? "is" : "are"} older than what is shown. </Typography.Text>}
                  {canShowOlder
                    ? <Button size="small" onClick={() => setLimit((n) => Math.min(n + PAGE, MAX_FEED))} loading={loading}>Show older</Button>
                    : <Typography.Text type="secondary">This shows the latest {MAX_FEED}. Mark all as read clears the older ones too.</Typography.Text>}
                </div>
              )}
            </Card>
          </>
        )}
      </PageShell>
    </div>
  );
}
