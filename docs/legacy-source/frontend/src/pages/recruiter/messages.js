import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Alert, Badge, Button, Card, Drawer, Empty, Input, List, Modal, Tag, Typography, message } from "antd";
import { MessageOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { momentFromApi } from "@/utils/placementDateTime";
import PageShell from "@/components/Common/PageShell";
import { ListSkeleton } from "@/components/Common/Skeletons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { appAction } from "@/redux/store";
import { useRouter } from "next/router";
import { getHrAllThreads, getHrThread, getRecruiterMessagesPulse, sendRecruiterMessage } from "@/api/Services/RecruiterService";
import useLivePulse from "@/components/tpo/ui/useLivePulse";
import useRecruiterCollege from "@/components/recruiter/useRecruiterCollege";
import { dj } from "@/components/tpo/dj";

const errorText = (e, fallback) => e?.response?.data?.message || e?.response?.data?.error || fallback;

/**
 * The inbox: every message thread with this college's placement cell, one place, newest first.
 * (A session belongs to one college, so there is nothing else to merge in.)
 */
export default function RecruiterMessagesPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [threads, setThreads] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const college = useRecruiterCollege();
  // The General conversation (not about one drive) used to send the recruiter to Home: they could never read or answer it.
  const [general, setGeneral] = useState(null); // { thread, rows, error } while open
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const generalRequestRef = useRef(0);
  const sendRef = useRef(false);

  useEffect(() => { dispatch(appAction.setActiveMenuItem("messages")); }, [dispatch]);

  const load = useCallback(() => {
    setError(null);
    getHrAllThreads()
      .then((threadsRes) => setThreads(Array.isArray(threadsRes?.data) ? threadsRes.data : []))
      .catch((e) => setError(errorText(e, "Could not load your messages")));
  }, []);
  useEffect(() => { load(); }, [load]);

  const openGeneral = async (t, { keepDraft = false } = {}) => {
    const requestId = ++generalRequestRef.current;
    if (!keepDraft) setDraft("");
    setGeneral({ thread: t || null, rows: t ? null : [], error: null });
    if (!t || !college.collegeId) return;
    try {
      const r = await getHrThread(college.collegeId, t.id);
      if (requestId !== generalRequestRef.current) return;
      if (!Array.isArray(r?.data)) throw new Error("Unexpected conversation response");
      setGeneral({ thread: t, rows: r.data, error: null });
      load();
    } catch (e) {
      if (requestId !== generalRequestRef.current) return;
      setGeneral({ thread: t, rows: null, error: errorText(e, "Could not load this conversation") });
    }
  };
  // Live: new messages (in any conversation, and in the open General one) show within seconds while this page is open.
  const generalLiveRef = useRef(null);
  useEffect(() => { generalLiveRef.current = general; }, [general]);
  const pulse = useCallback(() => getRecruiterMessagesPulse(college.collegeId), [college.collegeId]);
  const onLive = useCallback(() => {
    load();
    const open = generalLiveRef.current;
    if (open?.thread && !sendRef.current) openGeneral(open.thread, { keepDraft: true });
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps
  useLivePulse(pulse, onLive, { active: Boolean(college.collegeId) });

  const closeGeneral = () => {
    if (sendRef.current) return;
    const finish = () => {
      ++generalRequestRef.current;
      setDraft("");
      setGeneral(null);
    };
    if (!draft.trim()) {
      finish();
      return;
    }
    Modal.confirm({
      title: "Discard this unsent message?",
      content: "Your draft reply will be lost.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep writing",
      onOk: finish,
    });
  };
  const sendGeneral = async () => {
    if (!draft.trim() || !college.collegeId || sendRef.current) return;
    sendRef.current = true;
    setSending(true);
    const body = draft.trim();
    try {
      const r = await sendRecruiterMessage(college.collegeId, null, body);
      const threadId = r?.data?.threadId;
      setDraft("");
      const requestId = ++generalRequestRef.current;
      try {
        const t = await getHrThread(college.collegeId, threadId);
        if (requestId !== generalRequestRef.current) return;
        if (!Array.isArray(t?.data)) throw new Error("Unexpected conversation response");
        setGeneral((g) => ({
          thread: g?.thread || { id: threadId, subject: "General" },
          rows: t.data,
          error: null,
        }));
      } catch (refreshError) {
        if (requestId !== generalRequestRef.current) return;
        setGeneral((g) => ({
          thread: g?.thread || { id: threadId, subject: "General" },
          rows: Array.isArray(g?.rows) ? g.rows : [],
          error: "Message sent, but the conversation could not refresh. Retry to load the latest messages.",
        }));
      }
      load();
    } catch (e) {
      message.error(errorText(e, "Could not send"));
    } finally {
      sendRef.current = false;
      setSending(false);
    }
  };
  const openThread = (t) => (t.jobId ? router.push(`/recruiter/drives/${t.jobId}?tab=messages`) : openGeneral(t));
  const generalThread = (threads || []).find((t) => !t.jobId);

  if (error && !threads) {
    return (
      <div className="scroll-container recruiter-messages recruiter-messages--state">
        <PageShell>
          <ListingPageHeader className="recruiter-messages__header" title="Messages" />
          <Card className="recruiter-messages__state-card"><Alert type="warning" showIcon message={error} action={<Button size="small" icon={<ReloadOutlined />} onClick={load}>Retry</Button>} /></Card>
        </PageShell>
      </div>
    );
  }
  if (!threads) {
    return (
      <div className="scroll-container recruiter-messages recruiter-messages--state">
        <PageShell>
          <ListingPageHeader className="recruiter-messages__header" title="Messages" />
          <Card className="recruiter-messages__state-card"><ListSkeleton rows={6} avatar={false} label="Loading recruiter messages" /></Card>
        </PageShell>
      </div>
    );
  }

  const needle = q.trim().toLowerCase();
  const rows = needle
    ? threads.filter((t) => `${t.subject || ""} ${t.lastBody || ""}`.toLowerCase().includes(needle))
    : threads;
  const totalUnread = threads.reduce((sum, t) => sum + (Number(t.unread) || 0), 0);
  const unreadThreads = threads.filter((t) => Number(t.unread) > 0).length;

  return (
    <div className="scroll-container recruiter-messages" data-testid="recruiter.messages">
      <PageShell>
        <ListingPageHeader
          className="recruiter-messages__header"
          title="Messages"
          subtitle={<Typography.Text type="secondary">{totalUnread > 0 ? `${totalUnread} unread across ${threads.length} conversation${threads.length === 1 ? "" : "s"}` : "Your conversations with the placement cell: one for each drive (the same as that drive's Discussion tab) and a general one."}</Typography.Text>}
          rightContent={college.collegeId ? <Button type="primary" icon={<MessageOutlined />} onClick={() => openGeneral(generalThread)} data-testid="recruiter.messages.write">Message the placement cell</Button> : null}
        />

        {error && <Alert className="recruiter-messages__stale-alert" type="error" showIcon closable message="This refresh failed. Showing the last successful inbox." description={error} action={<Button size="small" icon={<ReloadOutlined />} onClick={load}>Retry</Button>} />}

        <Card className="recruiter-messages__workspace">
          <div className="recruiter-messages__toolbar">
            <Typography.Text strong>{rows.length} conversation{rows.length === 1 ? "" : "s"}{unreadThreads > 0 ? ` · ${unreadThreads} with new messages` : ""}</Typography.Text>
            {(threads.length > 6 || q) && <Input
              className="recruiter-messages__search"
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search by drive or message"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />}
          </div>

          {rows.length === 0 ? (
            <div className="recruiter-messages__empty">
              <Empty description={needle ? "No conversations match your search" : "No messages yet. Write to the placement cell, or open a drive to talk about it."}>
                {!needle && college.collegeId && <Button onClick={() => openGeneral(generalThread)}>Message the placement cell</Button>}
              </Empty>
            </div>
          ) : (
            <List
              className="recruiter-messages__list"
              itemLayout="horizontal"
              dataSource={rows}
              renderItem={(t) => (
                <List.Item
                  className={`recruiter-messages__thread ${t.unread > 0 ? "recruiter-messages__thread--unread" : ""}`}
                  onClick={() => openThread(t)}
                  data-testid={`recruiter.messages.thread-${t.id}`}
                >
                  <span className="recruiter-messages__thread-icon">
                    {t.unread > 0 ? <Badge dot offset={[-2, 2]}><MessageOutlined /></Badge> : <MessageOutlined />}
                  </span>
                  <List.Item.Meta
                    title={
                      <div className="recruiter-messages__thread-title">
                        <Typography.Text strong={t.unread > 0}>{t.subject || (t.jobId ? "Drive" : "General")}</Typography.Text>
                        <div>
                          {t.unread > 0 && <Tag color="gold">{t.unread} new</Tag>}
                        </div>
                      </div>
                    }
                    description={<Typography.Text type="secondary" ellipsis>{t.lastBody || "No messages yet"}</Typography.Text>}
                  />
                  <div className="recruiter-messages__thread-time">
                    {t.lastMessageAt && <Typography.Text type="secondary">{momentFromApi(t.lastMessageAt).fromNow()}</Typography.Text>}
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>
      </PageShell>
      <Drawer open={Boolean(general)} onClose={closeGeneral} maskClosable={!sending} keyboard={!sending} closable={!sending} width={480} title="Placement cell · General" data-testid="recruiter.messages.general">
        {general?.error ? (
          <Alert type="error" showIcon message="Conversation could not be loaded" description={general.error}
            action={<Button size="small" onClick={() => openGeneral(general.thread, { keepDraft: true })} disabled={sending}>Retry</Button>}
            style={{ marginBottom: 12 }} />
        ) : general?.rows === null ? <ListSkeleton rows={4} avatar={false} label="Loading general conversation" /> : (
          <List size="small" className="recruiter-messages__general-list" locale={{ emptyText: "No messages yet. Questions that are not about one drive go here." }} dataSource={general?.rows || []}
            renderItem={(m) => (
              <List.Item><div><b>{m.senderType === "RECRUITER" ? "You" : "Placement cell"}</b> <Typography.Text type="secondary">{dj(m.createdAt).format("D MMM, h:mm A")}</Typography.Text><div>{m.body}</div></div></List.Item>
            )} />
        )}
        <Input.TextArea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={general?.error && general?.rows === null ? "Retry the conversation before replying" : "Write to the placement cell"} style={{ marginTop: 12 }}
          disabled={sending || Boolean(general?.error && general?.rows === null)}
          onPressEnter={(e) => { if ((e.ctrlKey || e.metaKey) && !sendRef.current) sendGeneral(); }} />
        <Button type="primary" loading={sending} disabled={!draft.trim() || sending || Boolean(general?.error && general?.rows === null)} onClick={sendGeneral} style={{ marginTop: 8 }}>Send</Button>
      </Drawer>
    </div>
  );
}
