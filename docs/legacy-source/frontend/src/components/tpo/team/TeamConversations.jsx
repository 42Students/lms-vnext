import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Badge, Button, Checkbox, Empty, Form, Input, Modal, Radio, Select, Skeleton, Typography, message } from "antd";
import { ArrowLeftOutlined, BankOutlined, LockOutlined, NumberOutlined, PlusOutlined, SearchOutlined, SoundOutlined, SolutionOutlined, UserOutlined } from "@ant-design/icons";
import { dj } from "@/components/tpo/dj";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getTeamThreads, searchTeamThreads, startTeamThread, teamLookup } from "@/api/Services/TpoHubService";
import TeamConversation from "@/components/tpo/team/TeamConversation";

const FILTERS = [
  ["following", "Following"], ["all", "All"], ["me", "@ Me"], ["asks", "Asks"], ["decisions", "Decisions"],
  ["drives", "Drives"], ["companies", "Companies"], ["students", "Students"], ["topics", "Topics"],
];
const KIND_OF_FILTER = { drives: "DRIVE", companies: "COMPANY", students: "STUDENT", topics: "TOPIC" };
const ICON = { EVERYONE: <SoundOutlined />, DRIVE: <SolutionOutlined />, COMPANY: <BankOutlined />, STUDENT: <UserOutlined />, TOPIC: <NumberOutlined /> };
const errorText = (r, f) => r?.data?.message || r?.data?.error || f;

/** "10:42" today, "Yesterday", the weekday this week, else "3 Oct". */
export const whenText = (v) => {
  if (!v) return "";
  const d = dj(v);
  if (d.isSame(dj(), "day")) return d.format("h:mm A");
  if (d.isSame(dj().subtract(1, "day"), "day")) return "Yesterday";
  if (d.isAfter(dj().subtract(6, "day"))) return d.format("ddd");
  return d.format("D MMM");
};

/** Which conversations a filter shows (design §1: Following is the default). */
export function filterThreads(threads, filter) {
  return threads.filter((t) => {
    if (filter === "all") return true;
    if (filter === "following") return t.following;
    if (filter === "me") return Number(t.mentionsAll) > 0 || Number(t.myOpenAsks) > 0;
    if (filter === "asks") return Number(t.openAsks) > 0;
    if (filter === "decisions") return Number(t.decisions) > 0;
    return t.kind === KIND_OF_FILTER[filter];
  });
}

/**
 * Team > Conversations (design §1): the list on the left (search, filters, Everyone pinned, unread for followed ones), the
 * conversation in the middle and its details on the right. The address keeps the open conversation (?c=), a thing (?about=KIND:key),
 * a message to show (?m=) and the filter, so links from the bell, Home and other pages land in place. A phone shows one pane at a time.
 */
export default function TeamConversations({ meId, people = [] }) {
  const router = useRouter();
  const q = router.query;
  const activeId = q.c ? Number(q.c) : null;
  const about = useMemo(() => {
    if (activeId || typeof q.about !== "string") return null;
    const i = q.about.indexOf(":");
    return i > 0 ? { kind: q.about.slice(0, i).toUpperCase(), key: q.about.slice(i + 1) } : null;
  }, [q.about, activeId]);
  const filter = FILTERS.some(([k]) => k === q.filter) ? q.filter : "following";
  const [threads, setThreads] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState(null); // { ids:Set, snippet:{} } while searching
  const [showContext, setShowContext] = useState(true);
  const [creating, setCreating] = useState(false);
  const searchRef = useRef(null);

  const go = useCallback((next) => {
    const merged = { ...q, ...next };
    Object.keys(merged).forEach((k) => (merged[k] == null || merged[k] === "") && delete merged[k]);
    router.replace({ pathname: router.pathname, query: merged }, undefined, { shallow: true });
  }, [q, router]);

  const loadThreads = useCallback(async () => {
    const r = await fetchWithErrorHandling(getTeamThreads());
    if (!r.success) { setError(errorText(r, "Couldn't load conversations")); setThreads((t) => t || []); return; }
    setError(null);
    setThreads(Array.isArray(r.data) ? r.data : []);
  }, []);
  useEffect(() => { loadThreads(); }, [loadThreads]);

  // The details panel stays the way you left it; on a narrow screen it starts folded.
  useEffect(() => {
    let stored = null;
    try { stored = window.localStorage.getItem("team.details"); } catch (e) { /* private window */ }
    setShowContext(stored != null ? stored === "1" : window.innerWidth >= 1200);
  }, []);
  const toggleContext = () => setShowContext((v) => { try { window.localStorage.setItem("team.details", v ? "0" : "1"); } catch (e) { /* ignore */ } return !v; });

  // "/" jumps to search (not while typing somewhere).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (["input", "textarea", "select"].includes(tag) || document.activeElement?.isContentEditable) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Search reads every conversation you can read, messages included.
  useEffect(() => {
    const words = query.trim();
    if (words.length < 2) { setHits(null); return undefined; }
    const t = setTimeout(async () => {
      const r = await fetchWithErrorHandling(searchTeamThreads(words));
      if (!r.success) return;
      const rows = Array.isArray(r.data) ? r.data : [];
      setHits({ ids: new Set(rows.map((x) => Number(x.threadId))), snippet: Object.fromEntries(rows.map((x) => [Number(x.threadId), x.hit])) });
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Open the most useful one on a wide screen when nothing is asked for: the first unread you follow, else Everyone.
  useEffect(() => {
    // "Ask Ravi" from People (?ask=) opens Everyone with Ask set, on any screen.
    if (!threads || activeId || about || typeof window === "undefined" || (window.innerWidth < 992 && !q.ask)) return;
    const first = (q.ask && threads.find((t) => t.kind === "EVERYONE")) || threads.find((t) => t.following && Number(t.unread) > 0) || threads.find((t) => t.kind === "EVERYONE") || threads[0];
    if (first) go({ c: first.id });
  }, [threads, activeId, about]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => {
    const all = threads || [];
    if (hits) return all.filter((t) => hits.ids.has(Number(t.id)));
    return filterThreads(all, filter);
  }, [threads, filter, hits]);

  const counts = useMemo(() => Object.fromEntries(FILTERS.map(([k]) => [k, filterThreads(threads || [], k).length])), [threads]);
  const open = Boolean(activeId || about);

  return (
    <div className={`team-page${open ? " team-page--open" : ""}`} data-testid="tpo.team.conversations">
      <section className="team-list" aria-label="Conversations">
        <div className="team-list__top">
          <div className="team-list__search-row">
            <Input ref={searchRef} allowClear prefix={<SearchOutlined aria-hidden="true" />} placeholder="Search  (press /)" value={query}
              onChange={(e) => setQuery(e.target.value)} aria-label="Search conversations" />
            <Button type="primary" icon={<PlusOutlined />} aria-label="New conversation" onClick={() => setCreating(true)} />
          </div>
          {!hits && (
            <div className="team-list__filters" role="group" aria-label="Show">
              {FILTERS.map(([k, label]) => (
                <button key={k} type="button" className={`team-filter${filter === k ? " is-on" : ""}`} aria-pressed={filter === k} onClick={() => go({ filter: k === "following" ? null : k })}>
                  {label}{k !== "following" && k !== "all" && counts[k] ? <span className="team-filter__n">{counts[k]}</span> : null}
                </button>
              ))}
            </div>
          )}
          {hits && <Typography.Text type="secondary" className="team-list__search-note">{visible.length} {visible.length === 1 ? "conversation" : "conversations"} match</Typography.Text>}
        </div>
        {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={loadThreads}>Retry</Button>} className="team-list__error" />}
        <div className="team-list__items">
          {threads === null ? <Skeleton active paragraph={{ rows: 6 }} /> : visible.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={hits ? "Nothing matches. Try other words." : filter === "following" ? "You follow nothing else yet. All shows every conversation." : "Nothing here. Try All."} />
          ) : visible.map((t) => {
            const current = Number(t.id) === Number(activeId);
            const unread = current ? 0 : Number(t.unread) || 0;
            return (
              <button key={t.id} type="button" className={`team-row${current ? " is-current" : ""}${unread ? " is-unread" : ""}`} aria-current={current ? "true" : undefined}
                onClick={() => go({ c: t.id, about: null, m: null, ask: null })}>
                <span className={`team-row__icon team-row__icon--${String(t.kind).toLowerCase()}`} aria-hidden="true">{ICON[t.kind]}</span>
                <span className="team-row__body">
                  <span className="team-row__title">{t.title}{t.isPrivate && <LockOutlined className="team-row__lock" aria-label="Private" />}</span>
                  <span className="team-row__last">{hits?.snippet?.[Number(t.id)] || t.last || "No messages yet"}</span>
                </span>
                <span className="team-row__side">
                  <span className="team-row__when">{whenText(t.lastAt)}</span>
                  <span className="team-row__marks">
                    {!current && Number(t.mentionsNew) > 0 && <span className="team-row__at" aria-label="You were mentioned">@</span>}
                    {unread > 0 && <Badge count={unread} className="team-row__badge" />}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="team-page__conversation">
        {open ? (
          <>
            <Button className="team-page__back" type="text" icon={<ArrowLeftOutlined />} onClick={() => go({ c: null, about: null, m: null, ask: null })}>All conversations</Button>
            <TeamConversation key={activeId || `${about?.kind}:${about?.key}`} threadId={activeId} about={activeId ? null : about} meId={meId} people={people}
              showContext={showContext} onToggleContext={toggleContext} highlightMessageId={q.m ? Number(q.m) : null} initialAskAssignee={q.ask ? Number(q.ask) : null}
              onChanged={(what) => { loadThreads(); if (what === "left") go({ c: null }); }}
              onThreadCreated={(id) => go({ c: id, about: null })} />
          </>
        ) : (
          <div className="team-page__pick"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Pick a conversation, or start one with +." /></div>
        )}
      </div>

      <NewConversation open={creating} onClose={() => setCreating(false)} people={people} meId={meId}
        onStarted={(id) => { setCreating(false); loadThreads(); go({ c: id, about: null, filter: null }); }} />
    </div>
  );
}

/** New conversation (design §1): about a drive, a company or a student (one per thing: an existing one opens), or a topic. */
function NewConversation({ open, onClose, onStarted, people, meId }) {
  const [form] = Form.useForm();
  const kind = Form.useWatch("kind", form) || "DRIVE";
  const isPrivate = Form.useWatch("isPrivate", form);
  const [options, setOptions] = useState([]);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);
  useEffect(() => { if (open) { form.resetFields(); setOptions([]); } }, [open, form]);

  const search = async (words) => {
    const n = ++seq.current;
    const r = await fetchWithErrorHandling(teamLookup(words || ""));
    if (n !== seq.current || !r.success) return;
    const d = r.data || {};
    const list = kind === "DRIVE" ? (d.drives || []).map((x) => ({ value: String(x.id), label: x.label }))
      : kind === "COMPANY" ? (d.companies || []).map((x) => ({ value: x.key, label: x.label }))
        : (d.students || []).map((x) => ({ value: String(x.id), label: x.roll ? `${x.label} · ${x.roll}` : x.label }));
    setOptions(list);
  };
  useEffect(() => { if (open && kind !== "TOPIC") { form.setFieldValue("aboutKey", undefined); search(""); } }, [kind, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    const v = await form.validateFields();
    setBusy(true);
    try {
      const r = await fetchWithErrorHandling(startTeamThread({
        kind: v.kind, aboutKey: v.kind === "TOPIC" ? null : v.aboutKey, title: v.kind === "TOPIC" ? v.title : null,
        isPrivate: v.kind === "TOPIC" ? Boolean(v.isPrivate) : false, people: v.people || [], body: v.body || null,
      }));
      if (!r.success) { message.error(errorText(r, "Couldn't start it")); return; }
      onStarted(r.data?.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title="New conversation" okText="Start" onOk={submit} confirmLoading={busy} onCancel={onClose} destroyOnClose>
      <Typography.Paragraph type="secondary">About something in 42LMS? Pick it, and the conversation lives on its page too. Otherwise give it a topic.</Typography.Paragraph>
      <Form form={form} layout="vertical" initialValues={{ kind: "DRIVE", isPrivate: false }}>
        <Form.Item name="kind" label="About">
          <Radio.Group optionType="button" buttonStyle="solid" options={[{ value: "DRIVE", label: "A drive" }, { value: "COMPANY", label: "A company" }, { value: "STUDENT", label: "A student" }, { value: "TOPIC", label: "A topic" }]} />
        </Form.Item>
        {kind === "TOPIC" ? (
          <>
            <Form.Item name="title" label="Topic" rules={[{ required: true, whitespace: true, message: "Give it a topic" }]}>
              <Input maxLength={200} placeholder="Training vendor for aptitude" />
            </Form.Item>
            <Form.Item name="isPrivate" valuePropName="checked">
              <Checkbox>Private: only the people I pick can read it</Checkbox>
            </Form.Item>
          </>
        ) : (
          <Form.Item name="aboutKey" label={kind === "DRIVE" ? "Which drive" : kind === "COMPANY" ? "Which company" : "Which student"} rules={[{ required: true, message: "Pick one" }]}
            extra="If the team already talks about it, that conversation opens.">
            <Select showSearch filterOption={false} onSearch={search} options={options} placeholder={kind === "STUDENT" ? "Search by name or roll" : "Search"} notFoundContent="Nothing found" />
          </Form.Item>
        )}
        <Form.Item name="people" label={isPrivate && kind === "TOPIC" ? "People who can read it" : "Bring people in (optional)"}
          rules={isPrivate && kind === "TOPIC" ? [{ required: true, message: "Pick at least one person" }] : []}
          extra={isPrivate && kind === "TOPIC" ? "Only they and you can read it." : "The whole team can read it. People you pick follow it and get a bell."}>
          <Select mode="multiple" optionFilterProp="label" placeholder="Choose team members"
            options={people.filter((p) => Number(p.facultyId) !== Number(meId)).map((p) => ({ value: p.facultyId, label: p.name }))} />
        </Form.Item>
        <Form.Item name="body" label="First message (optional)">
          <Input.TextArea rows={3} maxLength={4000} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
