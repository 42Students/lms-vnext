import { useCallback, useEffect, useState } from "react";
import { Button, Drawer, Typography } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { bellRead, bellReadAll, getBell, getCounts } from "@/api/Services/TpoHubService";
import { dj } from "@/components/tpo/dj";
import { ListSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import { PanelEmpty, PanelError, PanelPartial } from "@/components/Common/PanelStates";

/**
 * The bell opens here, beside the page, the same way the recruiter's bell does (it used to leave the page for /tpo/notifications).
 * Unread items carry a dot. Opening one reads it for you only (read state is per person) and takes you to it.
 */
export default function TpoBellPanel({ open, onClose, onNavigate, onChanged }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  // BE-0042: the drawer shows the newest 20 asks only for those (limit=20); "Mark all read" follows the server's unread count.
  const [serverUnread, setServerUnread] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [r, c] = await Promise.all([fetchWithErrorHandling(getBell(20)), fetchWithErrorHandling(getCounts())]);
    setLoading(false);
    setServerUnread(c.success && c.data && c.data.bell != null ? Number(c.data.bell) || 0 : null);
    if (!r.success) { setError(r?.data?.message || r?.data?.error || "Could not load notifications"); return; }
    setError(null);
    setRows(Array.isArray(r.data) ? r.data.slice(0, 20) : []);
  }, []);
  useEffect(() => { if (open) load(); }, [open, load]);

  const openItem = async (n) => {
    if (!n.readAt) {
      const result = await fetchWithErrorHandling(bellRead(n.id));
      if (result.success) {
        const readAt = new Date().toISOString();
        setRows((prev) =>
          Array.isArray(prev)
            ? prev.map((row) => (row.id === n.id ? { ...row, readAt } : row))
            : prev
        );
        onChanged?.();
      }
    }

    // A notification without a destination is still useful as an informational/read item.
    // Keep the drawer open instead of making a click look like a failed navigation.
    if (n.link) {
      onClose();
      onNavigate(n.link);
    }
  };
  const readAll = async () => {
    const r = await fetchWithErrorHandling(bellReadAll());
    // getCounts may answer from its few-second cache (from before the read), so the known result wins.
    if (r.success) { await load(); setServerUnread(0); onChanged?.(); }
  };
  const shownUnread = (rows || []).filter((n) => !n.readAt).length;
  const unread = serverUnread != null ? Math.max(serverUnread, shownUnread) : shownUnread;

  return (
    <Drawer className="tpo-bell-panel" title="Notifications" open={open} onClose={onClose} width={400}
      extra={unread > 0 ? <Button size="small" onClick={readAll}>Mark all read</Button> : null}>
      {error && !rows ? (
        <PanelError
          compact
          title="Couldn't load notifications"
          description={error}
          onRetry={load}
        />
      ) : !rows ? <ListSkeleton rows={4} avatar={false} label="Loading notifications" />
        : (
          <>
            {loading && <RefreshStatus label="Refreshing notifications…" />}
            {error && (
              <PanelPartial
                compact
                title="Couldn't refresh notifications"
                description={error}
                onRetry={load}
                retryLabel="Retry"
              />
            )}
            {rows.length === 0 ? (
              <PanelEmpty
                compact
                icon={BellOutlined}
                title="Nothing yet"
                description="Things that happen on your drives and recruiters show up here."
              />
            ) : <ul className="tpo-bell-panel__list" data-testid="tpo.bell.list">
                {rows.map((n) => (
                  <li key={n.id}>
                    <button type="button" className={`tpo-bell-panel__item${n.readAt ? "" : " is-new"}`} onClick={() => openItem(n)}>
                      {!n.readAt && (
                        <>
                          <span className="tpo-bell-panel__dot" aria-hidden="true" />
                          <span className="sr-only">New notification. </span>
                        </>
                      )}
                      <span className="tpo-bell-panel__title">{n.title}</span>
                      {n.body && <span className="tpo-bell-panel__body">{n.body}</span>}
                      <span className="tpo-bell-panel__when">{n.createdAt ? dj(n.createdAt).format("D MMM, h:mm A") : ""}</span>
                    </button>
                  </li>
                ))}
              </ul>}
            </>
          )}
      <Typography.Paragraph style={{ marginTop: 16 }}>
        <Button type="link" style={{ padding: 0 }} onClick={() => { onClose(); onNavigate("/tpo/notifications"); }}>See all notifications</Button>
      </Typography.Paragraph>
    </Drawer>
  );
}
