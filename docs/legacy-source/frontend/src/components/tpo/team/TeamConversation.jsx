import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Alert, Button, Dropdown, Input, Modal, Select, Skeleton, Space, Typography, message } from "antd";
import { EllipsisOutlined, PushpinFilled } from "@ant-design/icons";
import { dj } from "@/components/tpo/dj";
import useRefreshOnFocus from "@/components/tpo/ui/useRefreshOnFocus";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import {
  addTeamThreadPeople, cancelTeamAsk, deleteTeamMessage, editTeamMessage, followTeamThread, getTeamAbout, leaveTeamThread, markTeamAskDone,
  markTeamDecision, muteTeamThread, openTeamThread, sendTeamAbout, sendTeamMessage, updateTeamTopic,
} from "@/api/Services/TpoHubService";
import TeamComposer from "@/components/tpo/team/TeamComposer";
import TeamContext from "@/components/tpo/team/TeamContext";
import TeamMessages from "@/components/tpo/team/TeamMessages";
import { plainText } from "@/components/tpo/team/teamTokens";

const KIND_LABEL = { EVERYONE: "Whole team", TOPIC: "Topic", DRIVE: "Drive", COMPANY: "Company", STUDENT: "Student" };
const errorText = (r, f) => r?.data?.message || r?.data?.error || f;
const truthy = (v) => v === true || v === 1 || v === "1";

/**
 * One Team conversation (design §1, middle and right panes). Opened by id (the Team page) or by what it is about ({ kind, key }: a
 * drive, company or student page, where it is made on the first message). Embedded on a thing's page it is compact and has no
 * details panel (the page is the details).
 */
export default function TeamConversation({ threadId, about, meId, people = [], embedded, showContext = true, onToggleContext, onChanged, onThreadCreated, highlightMessageId, initialAskAssignee }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showAllDecisions, setShowAllDecisions] = useState(false);
  const [editing, setEditing] = useState(null);
  const [doneAsk, setDoneAsk] = useState(null);
  const [doneNote, setDoneNote] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [adding, setAdding] = useState(null);
  const listRef = useRef(null);
  const loadSeq = useRef(0);
  const aboutKind = about?.kind;
  const aboutKey = about?.key;

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    const r = await fetchWithErrorHandling(threadId ? openTeamThread(threadId) : getTeamAbout(aboutKind, aboutKey));
    if (seq !== loadSeq.current) return;
    if (!r.success) { setError(errorText(r, "Couldn't load this conversation")); return; }
    setError(null);
    setData(r.data);
    onChanged?.();
  }, [threadId, aboutKind, aboutKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setData(null); setError(null); load(); }, [load]);
  useRefreshOnFocus(load);
  // New messages while the conversation is open on screen.
  useEffect(() => {
    const t = setInterval(() => { if (typeof document === "undefined" || document.visibilityState === "visible") load(); }, 30000);
    return () => clearInterval(t);
  }, [load]);

  const count = data?.messages?.length || 0;
  useEffect(() => {
    if (!count) return;
    const target = highlightMessageId && typeof document !== "undefined" ? document.getElementById(`team-message-${highlightMessageId}`) : null;
    if (target) target.scrollIntoView({ block: "center" });
    else if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [count, highlightMessageId]);

  const thread = data?.thread || {};
  const id = thread.id || null;
  const kind = thread.kind || aboutKind;

  /** Mentioning or asking someone outside a private conversation: ask first, then send again with addPeople. */
  const withAdding = async (call) => {
    let r = await fetchWithErrorHandling(call(false));
    if (!r.success && r?.data?.code === "ADD_PEOPLE") {
      const names = (r.data.people || []).join(", ");
      const yes = await new Promise((resolve) => Modal.confirm({
        title: `Add ${names}?`, content: "This conversation is private. They will see the earlier messages.", okText: "Add and send", cancelText: "Not now",
        onOk: () => resolve(true), onCancel: () => resolve(false),
      }));
      if (!yes) return false;
      r = await fetchWithErrorHandling(call(true));
    }
    if (!r.success) { message.error(errorText(r, "Couldn't send")); return false; }
    return r;
  };

  const send = async (payload) => {
    const r = await withAdding((addPeople) => (id ? sendTeamMessage(id, { ...payload, addPeople }) : sendTeamAbout(aboutKind, aboutKey, { ...payload, addPeople })));
    if (!r) return false;
    if (r.data?.notified > 0) message.success(`Sent. ${r.data.notified} ${r.data.notified === 1 ? "person was" : "people were"} told.`);
    if (!id && r.data?.threadId) onThreadCreated?.(r.data.threadId);
    await load();
    return true;
  };

  const act = async (call, ok) => {
    const r = await fetchWithErrorHandling(call);
    if (!r.success) { message.error(errorText(r, "That didn't work")); return false; }
    if (ok) message.success(ok);
    await load();
    return true;
  };

  const following = truthy(thread.following);
  const muted = truthy(thread.muted);
  const decisions = data?.decisions || [];
  const menu = id ? [
    kind === "EVERYONE"
      ? null
      : { key: "follow", label: following ? "Stop following" : "Follow", onClick: () => act(followTeamThread(id, !following), following ? "You'll no longer get unread counts for this" : "Following") },
    { key: "mute", label: muted ? "Unmute" : "Mute", onClick: () => act(muteTeamThread(id, !muted), muted ? "Unmuted" : "Muted: no unread count, no noise") },
    kind === "TOPIC" && { key: "rename", label: "Rename", onClick: () => setRenaming(thread.title || "") },
    kind === "TOPIC" && { key: "private", label: thread.isPrivate ? "Open to the whole team" : "Make private",
      onClick: () => Modal.confirm({
        title: thread.isPrivate ? "Open this to the whole team?" : "Make this private?",
        content: thread.isPrivate ? "Everyone in the placement team will be able to read it, including the earlier messages." : "Only the people in it now can read it. Others lose access.",
        okText: thread.isPrivate ? "Open to the team" : "Make private",
        onOk: () => act(updateTeamTopic(id, { isPrivate: !thread.isPrivate })),
      }) },
    kind === "TOPIC" && { key: "add", label: "Add people", onClick: () => setAdding([]) },
    thread.canLeave && { key: "leave", danger: true, label: "Leave", onClick: () => Modal.confirm({ title: "Leave this conversation?", content: "It is private: you won't be able to read it unless someone adds you again.", okText: "Leave", okButtonProps: { danger: true }, onOk: () => act(leaveTeamThread(id), "You left").then(() => onChanged?.("left")) }) },
  ].filter(Boolean) : [];

  if (error && !data) return <div className="team-conversation team-conversation--state"><Alert type="error" showIcon message={error} action={<Button size="small" onClick={load}>Retry</Button>} /></div>;
  if (!data) return <div className="team-conversation team-conversation--state"><Skeleton active paragraph={{ rows: 5 }} /></div>;

  const peopleLine = (data.people || []).map((p) => p.name).join(", ");
  return (
    <div className={`team-conversation${embedded ? " team-conversation--embedded" : ""}`} data-testid="team.conversation">
      <section className="team-conversation__main" aria-label={thread.title || "Conversation"}>
        {embedded ? (
          <div className="team-conversation__embedded-head">
            <Typography.Text type="secondary">Only your placement team sees this. {kind === "DRIVE" ? "The company never does." : "Recruiters and students never do."}</Typography.Text>
            <Space size={8}>
              {id && <Button size="small" onClick={() => act(followTeamThread(id, !following), following ? "Stopped following" : "Following")}>{following ? "Following" : "Follow"}</Button>}
              {id && <Link href={`/tpo/messages?tab=team&c=${id}`}>Open in Messages</Link>}
            </Space>
          </div>
        ) : (
          <header className="team-conversation__head">
            <div className="team-conversation__title-wrap">
              <div className="team-conversation__title-row">
                <h2 className="team-conversation__title">{thread.title}</h2>
                <span className="team-kind-chip">{thread.isPrivate ? "Private topic" : KIND_LABEL[kind] || "Conversation"}</span>
              </div>
              <Typography.Text type="secondary" className="team-conversation__people">{peopleLine || "Nobody has written yet"}</Typography.Text>
            </div>
            <Space size={8} wrap>
              {id && kind !== "EVERYONE" && <Button onClick={() => act(followTeamThread(id, !following))} aria-pressed={following}>{following ? "Following" : "Follow"}</Button>}
              {id && kind === "EVERYONE" && <Button onClick={() => act(muteTeamThread(id, !muted))} aria-pressed={muted}>{muted ? "Muted" : "Mute"}</Button>}
              {onToggleContext && <Button onClick={onToggleContext} aria-expanded={showContext}>{showContext ? "Hide details" : "Details"}</Button>}
              {menu.length > 0 && <Dropdown menu={{ items: menu }} trigger={["click"]}><Button icon={<EllipsisOutlined />} aria-label="Conversation settings" /></Dropdown>}
            </Space>
          </header>
        )}

        {embedded && (data.asks || []).length > 0 && (
          <div className="team-conversation__asks" data-testid="team.open-asks">
            {(data.asks || []).slice(0, 2).map((a) => (
              <div key={a.id} className={a.overdue ? "is-overdue" : ""}>
                <strong>{a.overdue ? "Overdue ask" : "Open ask"}</strong> {Number(a.assigneeId) === Number(meId) ? "You" : a.assigneeName}: {plainText(a.body)}
                {a.dueAt ? ` · by ${dj(a.dueAt).format(dj(a.dueAt).isSame(dj(), "year") ? "ddd D MMM, h:mm A" : "ddd D MMM YYYY, h:mm A")}` : ""}
              </div>
            ))}
            {(data.asks || []).length > 2 && <div>+{data.asks.length - 2} more</div>}
          </div>
        )}
        {decisions.length > 0 && (
          <div className="team-conversation__decisions" data-testid="team.decisions">
            <PushpinFilled aria-hidden="true" />
            <div className="team-conversation__decisions-body">
              {(showAllDecisions ? decisions : decisions.slice(0, 1)).map((d) => (
                <div key={d.id}><strong>Decided:</strong> {plainText(d.body)} <span className="team-conversation__decided-by">· {d.decidedBy} · {dj(d.decidedAt || d.createdAt).format("D MMM")}</span></div>
              ))}
            </div>
            {decisions.length > 1 && <Button type="link" size="small" onClick={() => setShowAllDecisions((v) => !v)}>{showAllDecisions ? "Show less" : `+${decisions.length - 1} more`}</Button>}
          </div>
        )}

        <div className="team-conversation__scroll" ref={listRef}>
          <TeamMessages messages={data.messages || []} meId={meId} highlightId={highlightMessageId}
            onAskDone={(a) => { setDoneNote(""); setDoneAsk(a); }}
            onAskCancel={(a) => Modal.confirm({ title: "Cancel this ask?", okText: "Cancel the ask", cancelText: "Keep it", onOk: () => act(cancelTeamAsk(a.id), "Ask cancelled") })}
            onDecision={(m, on) => act(markTeamDecision(m.id, on), on ? "Marked as a decision" : "Decision mark taken off")}
            onEdit={(m) => setEditing(m)}
            onDelete={(m) => Modal.confirm({ title: "Delete this message?", content: m.ask ? "Its ask is cancelled too." : "It shows as “Message removed”.", okText: "Delete", okButtonProps: { danger: true }, onOk: () => act(deleteTeamMessage(m.id), "Deleted") })} />
        </div>

        <div className="team-conversation__composer">
          <TeamComposer key={`${threadId || aboutKey}:${initialAskAssignee || ""}`} people={people} meId={meId} onSend={send} compact={embedded} initialAskAssignee={initialAskAssignee}
            inConversation={(data.people || []).map((p) => p.facultyId)} isPrivate={Boolean(thread.isPrivate)}
            teamReach={thread.isPrivate ? Math.max(0, (data.people || []).filter((p) => Number(p.facultyId) !== Number(meId)).length) : Math.max(0, people.filter((p) => Number(p.facultyId) !== Number(meId)).length)}
            placeholder={kind === "DRIVE" && embedded ? "Write to the team about this drive. @ to mention." : undefined} />
        </div>
      </section>

      {!embedded && showContext && (
        <TeamContext data={data} meId={meId} onAddPeople={() => setAdding([])}
          onShowAsk={(messageId) => { const el = document.getElementById(`team-message-${messageId}`); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }} />
      )}

      <Modal open={Boolean(editing)} title="Edit message" footer={null} onCancel={() => setEditing(null)} destroyOnClose width={640}>
        {editing && (
          <TeamComposer people={people} meId={meId} simple initialBody={editing.body} submitLabel="Save" onCancel={() => setEditing(null)}
            onSend={async ({ body }) => {
              const r = await withAdding((addPeople) => editTeamMessage(editing.id, body, addPeople));
              if (!r) return false;
              setEditing(null);
              await load();
              return true;
            }} />
        )}
        <Typography.Text type="secondary">A message can be edited for 15 minutes. People you newly mention are told.</Typography.Text>
      </Modal>

      <Modal open={Boolean(doneAsk)} title="Mark the ask done" okText="Mark done" onCancel={() => setDoneAsk(null)} destroyOnClose
        onOk={async () => { if (await act(markTeamAskDone(doneAsk.id, doneNote.trim()), "Done. They were told.")) setDoneAsk(null); }}>
        <Typography.Paragraph type="secondary">A note goes into the conversation as your reply (optional).</Typography.Paragraph>
        <Input.TextArea rows={3} maxLength={4000} value={doneNote} onChange={(e) => setDoneNote(e.target.value)} aria-label="Note (optional)" placeholder="Sent to both HODs at 3 PM." />
      </Modal>

      <Modal open={renaming !== null} title="Rename" okText="Save" onCancel={() => setRenaming(null)} destroyOnClose okButtonProps={{ disabled: !String(renaming || "").trim() }}
        onOk={async () => { if (await act(updateTeamTopic(id, { title: renaming.trim() }), "Renamed")) setRenaming(null); }}>
        <Input value={renaming || ""} maxLength={200} onChange={(e) => setRenaming(e.target.value)} aria-label="Topic" />
      </Modal>

      <Modal open={adding !== null} title="Add people" okText="Add" onCancel={() => setAdding(null)} destroyOnClose okButtonProps={{ disabled: !adding?.length }}
        onOk={async () => { if (await act(addTeamThreadPeople(id, adding), "Added. They were told.")) setAdding(null); }}>
        {thread.isPrivate && <Typography.Paragraph type="secondary">They will see the earlier messages.</Typography.Paragraph>}
        <Select mode="multiple" style={{ width: "100%" }} value={adding || []} onChange={setAdding} optionFilterProp="label" aria-label="People to add"
          options={people.filter((p) => Number(p.facultyId) !== Number(meId) && !(data.people || []).some((x) => Number(x.facultyId) === Number(p.facultyId)))
            .map((p) => ({ value: p.facultyId, label: p.name }))} />
        <Typography.Paragraph type="secondary" style={{ marginTop: 10, marginBottom: 0 }}>They follow it and get a bell.</Typography.Paragraph>
      </Modal>
    </div>
  );
}
