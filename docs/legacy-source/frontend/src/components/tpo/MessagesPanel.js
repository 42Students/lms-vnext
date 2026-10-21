import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Badge, Button, Empty, Input, List, Modal, Segmented, Select, Tag, Typography, message } from "antd";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import Router from "next/router";
import useRefreshOnFocus from "@/components/tpo/ui/useRefreshOnFocus";
import { dj } from "@/components/tpo/dj";
import { PanelError } from "@/components/Common/PanelStates";
import { ListSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getMessagesPulse, getThread, getThreads, sendMessage } from "@/api/Services/TpoHubService";
import useLivePulse from "@/components/tpo/ui/useLivePulse";
import { listRecruiterAccess } from "@/api/Services/TpoService";
import { RequestEventLine, RequestQuote } from "@/components/tpo/drive/RequestLine";

/**
 * In-app conversations with recruiters (TPO V1 - Locked.docx §1 "Where things arrive"): grouped by drive, with a General
 * thread per recruiter. Used on the Messages page and in a drive's Discussion (jobId given, recruiterId = the drive's recruiter).
 * A drive thread also shows its change requests' lines, and a message can quote a request: `quote` is the request "Discuss" was
 * pressed on; it goes out with the next message.
 */
const QUICK_REPLIES = ["Thanks, noted.", "Will confirm by end of day.", "Please share the updated list.", "Can we talk today?"];

/** "10:42 AM" today, "Yesterday", else "3 Oct": when a thread last moved. */
const whenText = (v) => {
  if (!v) return "";
  const d = dj(v);
  if (d.isSame(dj(), "day")) return d.format("h:mm A");
  if (d.isSame(dj().subtract(1, "day"), "day")) return "Yesterday";
  return d.format("D MMM");
};
const truthy = (v) => v === true || v === 1 || v === "1";

const MAX_MESSAGE = 4000;
const isEvent = (m) => m.kind === "EVENT";

export default function MessagesPanel({ jobId, recruiterId, quote, onQuoteClear, onSeeRequest, refreshKey }) {
  const me = useSelector((st) => st.loginUser);
  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  // Drafts are scoped to a conversation. A single shared draft could leak text from recruiter A
  // into recruiter B's composer when switching threads.
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadsError, setThreadsError] = useState(null);
  const [threadError, setThreadError] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [attentionFilter, setAttentionFilter] = useState("ALL");
  const listRef = useRef(null);
  // The inbox could only answer: with no thread yet there was no way to write to a recruiter from here.
  const [composing, setComposing] = useState(false);
  const [recruiters, setRecruiters] = useState(null);
  const [recruitersError, setRecruitersError] = useState(null);
  const [newTo, setNewTo] = useState(null);
  const [newBody, setNewBody] = useState("");
  // A drive's Discussion keeps one draft for the drive: keyed by thread, text typed before the thread had loaded was lost when it opened.
  const composerKey = jobId && recruiterId
    ? `drive:${jobId}:${recruiterId}`
    : (active?.id != null ? `thread:${active.id}` : null);
  const draft = composerKey ? (drafts[composerKey] || "") : "";
  const setDraft = useCallback((next) => {
    if (!composerKey) return;
    setDrafts((current) => {
      const previous = current[composerKey] || "";
      const value = typeof next === "function" ? next(previous) : next;
      return { ...current, [composerKey]: value };
    });
  }, [composerKey]);

  const hasMessageDraft = newBody.trim().length > 0 || Object.values(drafts).some((value) => String(value || "").trim().length > 0);
  useEffect(() => {
    if (!hasMessageDraft || busyRef.current || typeof window === "undefined") return undefined;
    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeRouteChange = () => {
      if (window.confirm("Discard your unsent recruiter message drafts?")) return;
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) window.history.pushState(null, "", Router.asPath);
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted to preserve recruiter message drafts.";
    };
    window.addEventListener("beforeunload", beforeUnload);
    Router.events.on("routeChangeStart", beforeRouteChange);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      Router.events.off("routeChangeStart", beforeRouteChange);
    };
  }, [hasMessageDraft]);

  // Open a thread (or send a message) and you are looking at the latest one, not the top of the history.
  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages, threadLoading]);

  // A thread-list failure used to render as "No conversations yet" and a single-thread failure as
  // a silently empty conversation - both indistinguishable from the genuinely empty case.
  const loadThreads = useCallback(async () => {
    setThreadsLoading(true);
    const res = await fetchWithErrorHandling(getThreads(jobId));
    setThreadsLoading(false);
    if (!res.success) { setThreadsError(res?.data?.message || res?.data?.error || "Could not load conversations"); return []; }
    setThreadsError(null);
    const rows = Array.isArray(res.data) ? res.data : [];
    setThreads(rows);
    return rows;
  }, [jobId]);

  const open = useCallback(async (thread) => {
    setActive(thread);
    setThreadError(null);
    setMessages([]);
    setThreadLoading(true);
    const res = await fetchWithErrorHandling(getThread(thread.id));
    setThreadLoading(false);
    if (!res.success) { setThreadError(res?.data?.message || res?.data?.error || "Could not load this conversation"); setMessages([]); return; }
    setThreadError(null);
    setMessages(Array.isArray(res.data) ? res.data : []);
    loadThreads();
  }, [loadThreads]);

  // Open straight into the conversation that needs you: a drive drawer opens its thread; the inbox opens the first one with something
  // unread (else the newest) on a wide screen, so reading the latest message takes no click.
  useEffect(() => {
    loadThreads().then((rows) => {
      if (!rows.length) return;
      // The drive's current recruiter: a previous recruiter's thread for the same drive must not be the one written to.
      if (jobId) { const mine = rows.find((t) => String(t.recruiterId) === String(recruiterId)); if (mine) open(mine); return; }
      if (typeof window !== "undefined" && window.innerWidth >= 992) open(rows.find((t) => Number(t.unread) > 0) || rows[0]);
    });
  }, [loadThreads, jobId, recruiterId, open]);

  // New messages from recruiters show up when you come back to the tab, not only on reload: the list, and the open conversation.
  const refreshAll = useCallback(async () => {
    const rows = await loadThreads();
    // A drive's thread may have been started meanwhile (a first message, or a request's line): open it.
    if (!active?.id && jobId) {
      const mine = rows.find((t) => String(t.recruiterId) === String(recruiterId));
      if (mine) open(mine);
      return;
    }
    if (active?.id) {
      const res = await fetchWithErrorHandling(getThread(active.id));
      if (res.success && Array.isArray(res.data)) {
        setMessages(res.data);
        setThreadError(null);
      } else {
        // Keep the last successful conversation visible, but label it stale rather than silently
        // pretending the background refresh succeeded.
        setThreadError(res?.data?.message || res?.data?.error || "Could not refresh this conversation");
      }
    }
  }, [loadThreads, active?.id, jobId, recruiterId, open]);
  useRefreshOnFocus(refreshAll);
  // Live: a recruiter's message (or their reading yours) shows within seconds while this is open.
  useLivePulse(getMessagesPulse, refreshAll);
  // A request settled on this page leaves a line here: the drive page bumps refreshKey so it shows without leaving the tab.
  const refreshRef = useRef(refreshAll);
  useEffect(() => { refreshRef.current = refreshAll; }, [refreshAll]);
  const firstKey = useRef(true);
  useEffect(() => {
    if (firstKey.current) { firstKey.current = false; return; }
    refreshRef.current();
  }, [refreshKey]);

  const loadRecruiters = async () => {
    setRecruitersError(null);
    setRecruiters(null);
    const r = await fetchWithErrorHandling(listRecruiterAccess());
    if (!r.success || !Array.isArray(r.data)) {
      setRecruiters([]);
      setRecruitersError(r?.data?.message || r?.data?.error || "Could not load recruiters with college access");
      return;
    }
    // Only recruiters who can still see the college: removed or expired access cannot read a message.
    setRecruiters(r.data.filter((h) => !h.revokedAt && h.status === "ACTIVE" && !h.expired));
  };

  const startNew = async () => {
    setNewTo(null);
    setNewBody("");
    setComposing(true);
    if (recruiters === null) await loadRecruiters();
  };

  const requestCloseCompose = () => {
    if (busyRef.current) return;
    if (!newBody.trim()) {
      setComposing(false);
      return;
    }
    Modal.confirm({
      title: "Discard this message draft?",
      content: "The message has not been sent.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep writing",
      onOk: () => {
        setNewBody("");
        setComposing(false);
      },
    });
  };

  const sendNew = async () => {
    if (busyRef.current || !newTo || !newBody.trim() || recruitersError) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await fetchWithErrorHandling(sendMessage({ recruiterId: newTo, jobId: null, body: newBody.trim() }));
      if (!res.success) { message.error(res?.data?.message || res?.data?.error || "Could not send"); return; }
      setNewBody("");
      setComposing(false);
      message.success("Message sent");
      const rows = await loadThreads();
      const t = rows.find((x) => x.id === res.data?.threadId);
      if (t) open(t);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const send = async () => {
    const target = active || (jobId && recruiterId ? { recruiterId, jobId } : null);
    if (!target || !draft.trim() || threadError || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await fetchWithErrorHandling(sendMessage({
        recruiterId: target.recruiterId, jobId: target.jobId ?? null, body: draft.trim(), changeRequestId: quote && target.jobId ? quote.id : null,
      }));
      if (!res.success) { message.error(res?.data?.message || res?.data?.error || "Could not send"); return; }
      setDraft("");
      onQuoteClear?.();
      message.success("Message sent");
      const rows = await loadThreads();
      const t = rows.find((x) => x.id === res.data.threadId);
      if (t) open(t);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const canWrite = active || (jobId && recruiterId);
  const accessEnded = active && active.accessActive !== undefined && !truthy(active.accessActive);
  // The recruiter has read your last message (shown under it, like a delivery tick).
  const lastMine = [...messages].reverse().find((m) => m.senderType === "TPO" && !isEvent(m));
  const unreadThreads = threads.filter((t) => Number(t.unread) > 0).length;
  const waitingCount = threads.filter((t) => t.lastSender === "RECRUITER").length;
  const visibleThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads.filter((t) => {
      const matchesSearch = !q || [t.recruiterName, t.subject, t.lastBody].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      const matchesAttention = attentionFilter === "ALL"
        || (attentionFilter === "WAITING" && t.lastSender === "RECRUITER")
        || (attentionFilter === "UNREAD" && Number(t.unread) > 0);
      return matchesSearch && matchesAttention;
    });
  }, [attentionFilter, query, threads]);

  return (
    <div className={`tpo-message-panel ${jobId ? "tpo-message-panel--drawer" : ""} ${active ? "tpo-message-panel--has-active" : ""}`}>
      {!jobId && (
        <aside className="tpo-message-panel__inbox">
          <Button className="tpo-message-panel__new" type="primary" icon={<PlusOutlined />} block onClick={startNew}>New message</Button>
          <Segmented
            aria-label="Conversation filter"
            block
            className="tpo-message-panel__attention"
            value={attentionFilter}
            onChange={setAttentionFilter}
            options={[
              { value: "ALL", label: `All (${threads.length})` },
              { value: "WAITING", label: `Reply (${waitingCount})` },
              { value: "UNREAD", label: `Unread (${unreadThreads})` },
            ]}
          />

          <Input
            className="tpo-message-panel__search"
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recruiter or drive"
            aria-label="Search conversations"
          />

          <div className="tpo-message-panel__thread-list">
            {threadsError && threads.length === 0 ? (
              <PanelError title={threadsError} onRetry={loadThreads} />
            ) : threadsLoading && threads.length === 0 ? (
              <ListSkeleton rows={4} avatar={false} label="Loading conversations" />
            ) : (
              <>
                {threadsLoading && threads.length > 0 && <RefreshStatus label="Refreshing conversations…" />}
                {threadsError && <Alert className="tpo-message-panel__alert" type="error" showIcon closable message="This refresh failed." description={threadsError} action={<Button size="small" onClick={loadThreads}>Retry</Button>} />}
                <List
                  size="small"
                  locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={query.trim() ? "No conversations match this search" : "No conversations yet"} /> }}
                  dataSource={visibleThreads}
                  renderItem={(t) => (
                    <List.Item
                      className={`tpo-message-panel__thread ${active?.id === t.id ? "tpo-message-panel__thread--active" : ""}`}
                      role="button"
                      tabIndex={0}
                      aria-current={active?.id === t.id ? "true" : undefined}
                      aria-label={`Open conversation with ${t.recruiterName || "recruiter"}: ${t.subject || "General"}`}
                      onClick={() => open(t)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          open(t);
                        }
                      }}
                    >
                      <List.Item.Meta
                        title={
                          <div className="tpo-message-panel__thread-title">
                            <span>{t.recruiterName}{t.recruiterCompany ? <Typography.Text type="secondary"> · {t.recruiterCompany}</Typography.Text> : null}</span>
                            <span className="tpo-message-panel__thread-when">
                              <Typography.Text type="secondary">{whenText(t.lastMessageAt)}</Typography.Text>
                              {Number(t.unread) > 0 && <Badge count={t.unread} />}
                            </span>
                          </div>
                        }
                        description={
                          <div className="tpo-message-panel__thread-description">
                            <span className="tpo-message-panel__subject">{t.subject || "General"}</span>
                            <Typography.Text type="secondary" ellipsis>{t.lastBody || "No messages yet"}</Typography.Text>
                            {t.lastSender === "RECRUITER" && <Tag color="gold">Waiting for you</Tag>}
                            {t.accessActive !== undefined && !truthy(t.accessActive) && <Tag>Access ended</Tag>}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </div>
        </aside>
      )}

      <section className="tpo-message-panel__conversation">
        {active && !jobId && (
          <div className="tpo-message-panel__conversation-head">
            <Button className="tpo-message-panel__back" type="text" icon={<ArrowLeftOutlined />} aria-label="All conversations" onClick={() => setActive(null)} />
            <div>
              <Typography.Title level={5}>{active.recruiterName}{active.recruiterCompany ? <Typography.Text type="secondary"> · {active.recruiterCompany}</Typography.Text> : null}</Typography.Title>
              <Typography.Text type="secondary">{active.subject || "General"}</Typography.Text>
            </div>
            {active.lastSender === "RECRUITER" && <Tag color="gold">Reply needed</Tag>}
          </div>
        )}

        {jobId && (
          <div className="tpo-message-panel__conversation-head">
            <div>
              <Typography.Title level={5}>Recruiter messages</Typography.Title>
            </div>
          </div>
        )}

        {threadError && <Alert className="tpo-message-panel__alert" type="error" showIcon closable message="This conversation failed to load." description={threadError} action={<Button size="small" onClick={() => open(active)}>Retry</Button>} />}

        {!canWrite && !threadError && (
          <div className="tpo-message-panel__empty-conversation">
            {/* One picture is enough: with no conversations the list already says so, so this side only says what to do. */}
            {threads.length || jobId
              ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={jobId ? "This drive has no recruiter login. Messages are for drives with a recruiter." : "Choose a conversation"} />
              : <Typography.Text type="secondary" className="tpo-messages__start">Start a conversation with New message. Messages about a drive are best sent from that drive.</Typography.Text>}
          </div>
        )}

        {canWrite && (
          <>
            <div
              className="tpo-message-panel__messages"
              ref={listRef}
              role="log"
              aria-live="polite"
              aria-relevant="additions text"
              aria-busy={threadLoading ? "true" : "false"}
              aria-label="Conversation messages"
            >
              {threadLoading ? (
                <ListSkeleton rows={5} avatar={false} label="Loading conversation" />
              ) : threadError && messages.length === 0 ? (
                <div className="tpo-message-panel__empty-messages">
                  <Typography.Text strong>Conversation history unavailable</Typography.Text>
                  <Typography.Text type="secondary">Retry the conversation before replying.</Typography.Text>
                </div>
              ) : messages.length === 0 ? (
                <div className="tpo-message-panel__empty-messages">
                  <Typography.Text strong>No messages yet</Typography.Text>
                  <Typography.Text type="secondary">Start the conversation here. Replies stay attached to this recruiter and drive.</Typography.Text>
                </div>
              ) : (
                messages.map((m) => {
                  const mine = m.senderType === "TPO";
                  // "You" only for your own messages: a colleague in the placement cell is named, and so is the recruiter.
                  const who = mine ? (String(m.senderId) === String(me?.id) ? "You" : m.senderName || "Placement cell") : m.senderName || "Recruiter";
                  if (isEvent(m)) return <RequestEventLine key={m.id} message={m} who={who} when={dj(m.createdAt).format("D MMM, h:mm A")} onSeeRequest={onSeeRequest} />;
                  return (
                    <div className={`tpo-message-panel__message-row ${mine ? "tpo-message-panel__message-row--mine" : ""}`} key={m.id}>
                      {m.request && <RequestQuote request={m.request} onSeeRequest={onSeeRequest} />}
                      <div className={`tpo-message-panel__bubble ${mine ? "tpo-message-panel__bubble--mine" : ""}`}>{m.body}</div>
                      <Typography.Text className="tpo-message-panel__message-meta" type="secondary">
                        {who} · {dj(m.createdAt).format("D MMM, h:mm A")}{m.via === "EMAIL" ? " · by email" : ""}{lastMine && m.id === lastMine.id && m.readAt ? " · Seen" : ""}
                      </Typography.Text>
                    </div>
                  );
                })
              )}
            </div>

            {accessEnded && (
              <Alert className="tpo-message-panel__alert" type="warning" showIcon message="This recruiter's access to your college has ended, so they cannot read new messages."
                description="Give access again in Settings > Recruiters to write to them." />
            )}
            <div className="tpo-message-panel__composer">
              {!threadError && (
                <div className="tpo-message-panel__quick" role="group" aria-label="Quick replies">
                  {QUICK_REPLIES.map((q) => (
                    <Button
                      key={q}
                      size="small"
                      className="tpo-message-panel__quick-reply"
                      onClick={() => setDraft((d) => (d ? `${d} ${q}` : q))}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              )}
              {quote && jobId && <RequestQuote request={quote} onRemove={onQuoteClear} />}
              <Input.TextArea
                rows={3}
                maxLength={MAX_MESSAGE}
                showCount={draft.length > MAX_MESSAGE - 500}
                value={draft}
                disabled={Boolean(threadError)}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={threadError ? "Retry the conversation before replying" : quote && jobId ? "Write about this request" : "Write a message"}
                aria-label="Message"
                onPressEnter={(e) => { if (e.ctrlKey || e.metaKey) send(); }}
              />
              <div className="tpo-message-panel__composer-footer">
                <Typography.Text type="secondary">Ctrl/Cmd + Enter to send</Typography.Text>
                <Button type="primary" loading={busy} disabled={!draft.trim() || accessEnded || Boolean(threadError) || busy} onClick={send}>Send message</Button>
              </div>
            </div>
          </>
        )}
      </section>

      <Modal open={composing} title="New message to a recruiter" onCancel={requestCloseCompose} okText="Send" confirmLoading={busy}
        maskClosable={false}
        okButtonProps={{ disabled: !newTo || !newBody.trim() || Boolean(recruitersError) || busy }} onOk={sendNew} destroyOnClose>
        {recruitersError && (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 12 }}
            message="Recruiter list unavailable"
            description={recruitersError}
            action={<Button size="small" onClick={loadRecruiters}>Retry</Button>}
          />
        )}
        <Select showSearch optionFilterProp="label" placeholder={recruitersError ? "Recruiters unavailable" : "Choose a recruiter"} aria-label="Choose a recruiter" style={{ width: "100%", marginBottom: 12 }} value={newTo} onChange={setNewTo}
          loading={recruiters === null}
          disabled={Boolean(recruitersError)}
          notFoundContent={!recruitersError && recruiters && recruiters.length === 0 ? "No recruiter has access to your college yet. Invite one from Engage." : undefined}
          options={(recruiters || []).map((h) => ({ value: h.recruiterId, label: [h.name, h.company].filter(Boolean).join(" · ") }))} />
        <Input.TextArea rows={4} maxLength={MAX_MESSAGE} showCount={newBody.length > MAX_MESSAGE - 500} value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Write a message" aria-label="New message" />
        <Typography.Text type="secondary">This starts their General thread. Messages about a drive are best sent from that drive.</Typography.Text>
      </Modal>
    </div>
  );
}
