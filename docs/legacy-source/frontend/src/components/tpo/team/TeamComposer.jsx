import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, DatePicker, Input, Select, Space, Tag, Typography } from "antd";
import { CheckSquareOutlined, PushpinOutlined } from "@ant-design/icons";
import { dj, serverTime } from "@/components/tpo/dj";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { teamLookup } from "@/api/Services/TpoHubService";
import { TEAM_TOKEN, chipToken, mentionToken, parseBody } from "@/components/tpo/team/teamTokens";

export const MAX_TEAM_MESSAGE = 4000;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * What the writer sees ("@Ravi Kumar", "#Omega · SDE") and what is sent (tokens): the composer keeps the picked people and things,
 * and swaps their words for tokens on send, so a name typed by hand is never a mention by accident.
 */
export function toTokens(text, picks) {
  let out = text;
  // Longest first, so "@Ravi Kumar" wins over "@Ravi".
  [...picks].sort((a, b) => b.shown.length - a.shown.length).forEach((p) => {
    out = out.replace(new RegExp(`${escapeRe(p.shown)}(?![\\w])`, "g"), p.token);
  });
  return out;
}

/** A sent body back into words and picks, for editing. */
export function fromTokens(body) {
  const picks = [];
  const text = parseBody(body).map((p) => {
    if (p.type === "mention") { picks.push({ shown: p.text, token: mentionToken({ name: p.text.slice(1), facultyId: p.id }) }); return p.text; }
    if (p.type === "team") { picks.push({ shown: "@team", token: TEAM_TOKEN }); return "@team"; }
    if (p.type === "chip") { const shown = `#${p.text}`; picks.push({ shown, token: chipToken(p.kind, p.key, p.text) }); return shown; }
    return p.text;
  }).join("");
  return { text, picks };
}

/**
 * The Team composer (design §2): @ people, # drives / companies / students, Ask (one person, an optional "by" date) and Decision.
 * Enter sends, Shift+Enter is a new line. onSend({ body, askAssigneeId, askDueAt, decision }) resolves true when it went.
 */
export default function TeamComposer({ people = [], meId, onSend, placeholder = "Write to the team. @ to mention, # to link a drive, company or student.", disabled, compact,
  initialBody, simple, submitLabel = "Send", onCancel, initialAskAssignee, teamReach, inConversation, isPrivate }) {
  // Editing starts from the message's words and its people and things (simple: no Ask or Decision, which stay as they were).
  const [text, setText] = useState(() => (initialBody ? fromTokens(initialBody).text : ""));
  const [picks, setPicks] = useState(() => (initialBody ? fromTokens(initialBody).picks : []));
  const [suggest, setSuggest] = useState(null); // { type: "@"|"#", query, start }
  const [options, setOptions] = useState([]);
  const [active, setActive] = useState(0);
  // "Ask Ravi" on People opens a conversation with Ask already set to them.
  const [asking, setAsking] = useState(Boolean(initialAskAssignee));
  const [assignee, setAssignee] = useState(initialAskAssignee ? Number(initialAskAssignee) : null);
  const [due, setDue] = useState(null);
  const [deciding, setDeciding] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  const lookupSeq = useRef(0);

  const others = useMemo(() => people.filter((p) => Number(p.facultyId) !== Number(meId)), [people, meId]);

  // What to suggest for the word being typed.
  useEffect(() => {
    if (!suggest) { setOptions([]); return; }
    const q = suggest.query.toLowerCase();
    if (suggest.type === "@") {
      const list = others.filter((p) => !q || String(p.name || "").toLowerCase().split(/\s+/).some((w) => w.startsWith(q)) || String(p.name || "").toLowerCase().startsWith(q))
        .slice(0, 6).map((p) => {
          const inIt = inConversation ? inConversation.some((id) => Number(id) === Number(p.facultyId)) : null;
          const where = inIt == null ? "" : inIt ? "in this conversation" : isPrivate ? "will be added" : "will follow it";
          const away = p.awayUntil ? `away until ${dj(p.awayUntil).format("D MMM")}` : "";
          return { key: `f${p.facultyId}`, label: p.name, note: [where, away].filter(Boolean).join(" · "), shown: `@${p.name}`, token: mentionToken(p) };
        });
      if (!q || "team".startsWith(q)) {
        const reach = teamReach != null ? teamReach : others.length;
        list.push({ key: "team", label: "team", note: `tells ${reach} ${reach === 1 ? "person" : "people"}`, shown: "@team", token: TEAM_TOKEN });
      }
      setOptions(list);
      setActive(0);
      return;
    }
    const seq = ++lookupSeq.current;
    const t = setTimeout(async () => {
      const r = await fetchWithErrorHandling(teamLookup(suggest.query));
      if (seq !== lookupSeq.current || !r.success) return;
      const d = r.data || {};
      setOptions([
        ...(d.drives || []).map((x) => ({ key: `d${x.id}`, label: x.label, note: "drive", shown: `#${x.label}`, token: chipToken("d", x.id, x.label) })),
        ...(d.companies || []).map((x) => ({ key: `c${x.key}`, label: x.label, note: "company", shown: `#${x.label}`, token: chipToken("c", x.key, x.label) })),
        ...(d.students || []).map((x) => ({ key: `s${x.id}`, label: x.label, note: x.roll ? `student · ${x.roll}` : "student", shown: `#${x.label}`, token: chipToken("s", x.id, x.label) })),
      ]);
      setActive(0);
    }, 200);
    return () => clearTimeout(t);
  }, [suggest, others, inConversation, isPrivate, teamReach]);

  const onChange = (e) => {
    const value = e.target.value.slice(0, MAX_TEAM_MESSAGE);
    setText(value);
    const caret = e.target.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const m = before.match(/(^|\s)([@#])([^\s@#][^@#\n]{0,40}|)$/);
    if (m && (m[2] === "#" || !/\s/.test(m[3]))) setSuggest({ type: m[2], query: m[3], start: caret - m[3].length - 1 });
    else setSuggest(null);
  };

  const pick = (o) => {
    if (!o || !suggest) return;
    const caret = suggest.start + 1 + suggest.query.length;
    const next = `${text.slice(0, suggest.start)}${o.shown} ${text.slice(caret)}`;
    setText(next.slice(0, MAX_TEAM_MESSAGE));
    setPicks((all) => (all.some((p) => p.shown === o.shown) ? all : [...all, { shown: o.shown, token: o.token }]));
    setSuggest(null);
    setTimeout(() => ref.current?.focus(), 0);
  };

  const awayWarning = useMemo(() => {
    const p = others.find((x) => Number(x.facultyId) === Number(assignee));
    return p?.awayUntil ? `${String(p.name).split(" ")[0]} is away until ${dj(p.awayUntil).format("ddd D MMM")}.` : null;
  }, [assignee, others]);

  const send = async () => {
    const body = toTokens(text.trim(), picks);
    if (!body || busy || disabled) return;
    if (asking && !assignee) return;
    setBusy(true);
    try {
      const ok = await onSend({ body, askAssigneeId: asking ? assignee : null, askDueAt: asking && due ? serverTime(due) : null, decision: deciding });
      if (ok) {
        setText(""); setPicks([]); setAsking(false); setAssignee(null); setDue(null); setDeciding(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (suggest && options.length) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % options.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i - 1 + options.length) % options.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pick(options[active]); return; }
      if (e.key === "Escape") { e.preventDefault(); setSuggest(null); return; }
    }
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) { e.preventDefault(); send(); }
  };

  const count = text.length;
  return (
    <div className={`team-composer${compact ? " team-composer--compact" : ""}`} data-testid="team.composer">
      {suggest && options.length > 0 && (
        <div className="team-composer__suggest" role="listbox" aria-label={suggest.type === "@" ? "Mention someone" : "Link a drive, company or student"}>
          {options.map((o, i) => (
            <button key={o.key} type="button" role="option" aria-selected={i === active} className={`team-composer__option${i === active ? " is-active" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); pick(o); }}>
              <span className="team-composer__option-label">{suggest.type}{o.label}</span>
              {o.note && <span className="team-composer__option-note">{o.note}</span>}
            </button>
          ))}
        </div>
      )}
      {asking && (
        <div className="team-composer__ask" data-testid="team.composer.ask">
          <Typography.Text strong>Ask</Typography.Text>
          <Select size="small" style={{ minWidth: 180 }} placeholder="Who" value={assignee} onChange={setAssignee} aria-label="Who to ask"
            options={people.map((p) => ({ value: p.facultyId, label: Number(p.facultyId) === Number(meId) ? `${p.name} (you)` : p.name }))} />
          <DatePicker size="small" showTime={{ format: "h:mm A" }} format="D MMM, h:mm A" placeholder="By (optional)" value={due} onChange={setDue} aria-label="By when"
            disabledDate={(d) => d && d.endOf("day").isBefore(dj())} />
          {awayWarning && <Typography.Text className="team-composer__warn">{awayWarning}</Typography.Text>}
        </div>
      )}
      <Input.TextArea ref={ref} autoSize={{ minRows: compact ? 1 : 2, maxRows: 8 }} value={text} onChange={onChange} onKeyDown={onKeyDown} disabled={disabled || busy}
        placeholder={placeholder} aria-label="Message to the team" maxLength={MAX_TEAM_MESSAGE} />
      <div className="team-composer__bar">
        <Space size={6} wrap>
          <Button size="small" aria-label="Mention someone" onClick={() => { setText((t) => `${t}${t && !/\s$/.test(t) ? " " : ""}@`); setSuggest({ type: "@", query: "", start: text.length + (text && !/\s$/.test(text) ? 1 : 0) }); ref.current?.focus(); }}>@</Button>
          <Button size="small" aria-label="Link a drive, company or student" onClick={() => { setText((t) => `${t}${t && !/\s$/.test(t) ? " " : ""}#`); setSuggest({ type: "#", query: "", start: text.length + (text && !/\s$/.test(text) ? 1 : 0) }); ref.current?.focus(); }}>#</Button>
          {!simple && <Button size="small" icon={<CheckSquareOutlined />} aria-pressed={asking} className={asking ? "team-composer__toggle is-ask" : "team-composer__toggle"} onClick={() => setAsking((v) => !v)}>Ask someone</Button>}
          {!simple && <Button size="small" icon={<PushpinOutlined />} aria-pressed={deciding} className={deciding ? "team-composer__toggle is-decision" : "team-composer__toggle"} onClick={() => setDeciding((v) => !v)}>Mark as decision</Button>}
          {deciding && <Tag color="green">Will be pinned as a decision</Tag>}
        </Space>
        <Space size={10}>
          <Typography.Text type="secondary" className="team-composer__hint">{count > MAX_TEAM_MESSAGE - 300 ? `${count} / ${MAX_TEAM_MESSAGE}` : "Enter sends · Shift+Enter new line"}</Typography.Text>
          {onCancel && <Button onClick={onCancel}>Cancel</Button>}
          <Button type="primary" onClick={send} loading={busy} disabled={disabled || !text.trim() || (asking && !assignee)}>{submitLabel}</Button>
        </Space>
      </div>
      {asking && !assignee && text.trim() && <Alert type="info" showIcon message="Pick who you're asking, or turn Ask off." style={{ marginTop: 6 }} />}
    </div>
  );
}
