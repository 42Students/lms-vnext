import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { Alert, Badge, Button, Drawer, List, Segmented, Typography, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import PageShell from "@/components/Common/PageShell";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import AnnouncementList from "@/components/tpo/announcements/AnnouncementList";
import AnnouncementComposer from "@/components/tpo/announcements/AnnouncementComposer";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import {
  deleteAnnouncement, getAnnouncementUnreadBy, getAnnouncementsFrom42, getFrom42Unread, getMyAnnouncements, postAnnouncement, remindAnnouncement,
  undoAnnouncement, updateAnnouncement,
} from "@/api/Services/TpoHubService";

const errorText = (r, f) => r?.data?.message || r?.data?.error || f;

/**
 * Announcements (N12; V2, backend docs/tpo-announcements/ANNOUNCEMENTS-V2-2026-10-12.md): what the placement cell tells its students,
 * to whom, and who has read it; and what 42 tells placement cells (with an unread count).
 */
export default function TpoAnnouncements() {
  const dispatch = useDispatch();
  const router = useRouter();
  const tab = router.query.tab === "from42" ? "from42" : "students";
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // {} for a new one, or the announcement
  const [from42Unread, setFrom42Unread] = useState(0);
  const [readers, setReaders] = useState(null); // { a, rows }

  useEffect(() => { dispatch(appAction.setActiveMenuItem("announcements")); }, [dispatch]);

  const load = useCallback(async () => {
    setItems(null);
    const r = await fetchWithErrorHandling(tab === "from42" ? getAnnouncementsFrom42() : getMyAnnouncements());
    if (!r.success) { setError(errorText(r, "Couldn't load announcements")); setItems([]); return; }
    setError(null);
    setItems(Array.isArray(r.data) ? r.data : []);
    const u = await fetchWithErrorHandling(getFrom42Unread());
    if (u.success) setFrom42Unread(Number(u.data?.unread) || 0);
  }, [tab]);
  useEffect(() => { if (router.isReady) load(); }, [load, router.isReady]);

  const save = async (body) => {
    const isNew = !editing?.id;
    const r = await fetchWithErrorHandling(isNew ? postAnnouncement(body) : updateAnnouncement(editing.id, body));
    if (!r.success) { message.error(errorText(r, "Couldn't save")); return false; }
    setEditing(null);
    load();
    if (!isNew) { message.success(r.data?.told ? `Saved. ${r.data.told} students were told it changed.` : "Saved"); return true; }
    if (r.data?.scheduledFor) { message.success("Scheduled"); return true; }
    // Sent: the notices wait 30 seconds, so it can still be taken back.
    const id = r.data?.id;
    const key = `announcement-sent-${id}`;
    message.open({
      key, type: "success", duration: 30,
      content: (
        <span>
          Sent to {r.data?.recipients ?? r.data?.studentsTold} {Number(r.data?.recipients ?? r.data?.studentsTold) === 1 ? "student" : "students"}.{" "}
          <Button size="small" type="link" onClick={async () => {
            const u = await fetchWithErrorHandling(undoAnnouncement(id));
            message.destroy(key);
            if (!u.success) { message.error(errorText(u, "Couldn't undo")); return; }
            message.info("Undone. Nobody was told.");
            load();
          }}>Undo</Button>
        </span>
      ),
    });
    return true;
  };

  const showReaders = async (a) => {
    setReaders({ a, rows: null });
    const r = await fetchWithErrorHandling(getAnnouncementUnreadBy(a.id));
    setReaders({ a, rows: r.success && Array.isArray(r.data) ? r.data : [], error: r.success ? null : errorText(r, "Couldn't load who hasn't read it") });
  };
  const remind = async (a) => {
    const r = await fetchWithErrorHandling(remindAnnouncement(a.id));
    if (!r.success) { message.error(errorText(r, "Couldn't remind them")); return; }
    message.success(`Reminded ${r.data?.reminded ?? 0} ${Number(r.data?.reminded) === 1 ? "student" : "students"}`);
    load();
  };

  return (
    <div className="scroll-container tpo-announcements" data-testid="tpo.announcements">
      <PageShell>
        <ListingPageHeader
          title="Announcements"
          subtitle={<Typography.Text type="secondary">{tab === "from42" ? "What 42 tells placement cells." : "What you tell your students, to whom, and who has read it. They read it under Placements."}</Typography.Text>}
          rightContent={tab === "students" ? <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({})}>New announcement</Button> : null}
        />
        <Segmented value={tab} style={{ marginBottom: 16 }}
          onChange={(v) => router.replace({ pathname: router.pathname, query: v === "from42" ? { tab: "from42" } : {} }, undefined, { shallow: true })}
          options={[{ value: "students", label: "To your students" }, { value: "from42", label: <span>From 42 {from42Unread > 0 && tab !== "from42" ? <Badge count={from42Unread} size="small" /> : null}</span> }]} />
        {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={load}>Retry</Button>} style={{ marginBottom: 12 }} />}
        {tab === "students" ? (
          <AnnouncementList mode="cell" items={items} loading={items === null}
            emptyText="Nothing yet. Tell students about a talk, a deadline or a change; pick who it is for, and see who has read it."
            onEdit={(a) => setEditing(a)} onUnreadBy={showReaders} onRemind={remind}
            onDelete={async (a) => {
              const r = await fetchWithErrorHandling(deleteAnnouncement(a.id));
              if (!r.success) { message.error(errorText(r, "Couldn't delete")); return; }
              message.success("Deleted. Its notices were taken back.");
              load();
            }} />
        ) : (
          <AnnouncementList mode="from42" items={items} loading={items === null} emptyText="Nothing from 42 yet." />
        )}
      </PageShell>

      <AnnouncementComposer open={Boolean(editing)} editing={editing} onClose={() => setEditing(null)} onSave={save} />

      <Drawer open={Boolean(readers)} onClose={() => setReaders(null)} width={420} title={readers ? `Hasn't read: ${readers.a.title}` : ""}
        extra={readers?.rows?.length ? <Button type="primary" onClick={() => remind(readers.a)}>Remind them</Button> : null}>
        {readers?.error && <Alert type="error" showIcon message={readers.error} />}
        <Typography.Paragraph type="secondary">A reminder goes only to these students, at most once an hour.</Typography.Paragraph>
        <List loading={readers?.rows === null} dataSource={readers?.rows || []} locale={{ emptyText: "Everyone has read it." }}
          renderItem={(s) => <List.Item><List.Item.Meta title={s.name || `#${s.learnerId}`} description={[s.roll, s.branch].filter(Boolean).join(" · ")} /></List.Item>} />
        {readers?.rows?.length === 500 && <Typography.Text type="secondary">Showing the first 500.</Typography.Text>}
      </Drawer>
    </div>
  );
}
