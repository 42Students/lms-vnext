import { useEffect, useState } from "react";
import { Alert, Button, Descriptions, Drawer, Empty, Input, message, Select, Skeleton, Space, Tag, Timeline, Typography } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import {
  commentOnAuditFinding,
  getAuditFinding,
  linkAuditFindingCommit,
  setAuditFindingAssignee,
  setAuditFindingSeverity,
  setAuditFindingStatus,
} from "@/api/Services/AuditFindingsService";
import { CLOSED, NEEDS_NOTE, REPOS, SEVERITY, SEVERITY_ORDER, STATUS, istTime, nextStatuses, promptForAgent } from "./auditFindingsModel";

const { Text, Paragraph } = Typography;

// Everything in a finding was written by an auditor (often an AI): it is shown as plain text only, never as HTML or links.
function Plain({ children }) {
  if (children === null || children === undefined || children === "") return <Text type="secondary">Not given</Text>;
  return <Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{String(children)}</Paragraph>;
}

const EVENT_LABEL = {
  imported: "Reported",
  agent_update: "Agent update",
  status: "Status",
  severity: "Severity",
  assignee: "Assigned",
  comment: "Comment",
  commit: "Fix commit linked",
  file_changed: "File changed after import",
  file_deleted: "File deleted after import",
};

function eventText(e) {
  const v = (x) => STATUS[x]?.label || SEVERITY[x]?.label || x;
  if (e.type === "status") return `${v(e.fromValue)} → ${v(e.toValue)}`;
  if (e.type === "severity") return `${v(e.fromValue)} → ${v(e.toValue)}`;
  if (e.type === "assignee") return e.toValue ? `to ${e.toValue}` : "unassigned";
  if (e.type === "agent_update") return e.toValue ? `says: ${e.toValue.replace("-", " ")}` : "";
  if (e.type === "commit") return e.toValue;
  return "";
}

export default function AuditFindingDrawer({ id, open, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [nextStatus, setNextStatus] = useState(null);
  const [note, setNote] = useState("");
  const [duplicateOf, setDuplicateOf] = useState("");
  const [comment, setComment] = useState("");
  const [commit, setCommit] = useState({ repo: "lms2-fe", sha: "" });
  const [assignee, setAssignee] = useState("");

  const load = () => {
    if (!id) return;
    setError(null);
    getAuditFinding(id)
      .then((d) => { setData(d); setAssignee(d?.finding?.assignee || ""); })
      .catch((e) => setError(e?.response?.data?.message || "Couldn't load this finding."));
  };

  useEffect(() => {
    setData(null);
    setNextStatus(null);
    setNote("");
    setDuplicateOf("");
    setComment("");
    setCommit({ repo: "lms2-fe", sha: "" });
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, open]);

  const run = async (fn, done) => {
    setBusy(true);
    try {
      const d = await fn();
      setData(d);
      setAssignee(d?.finding?.assignee || "");
      done?.();
      onChanged?.();
    } catch (e) {
      message.error(e?.response?.data?.message || e?.response?.data?.error || "That didn't save. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const f = data?.finding;
  const where = f?.where_json || {};
  const reopening = f && nextStatus && CLOSED.has(f.status) && !CLOSED.has(nextStatus);
  const noteNeeded = nextStatus && (NEEDS_NOTE.has(nextStatus) || reopening);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptForAgent(f));
      message.success("Copied. Paste it to the agent that will fix it.");
    } catch {
      message.error("Couldn't copy. Your browser blocked the clipboard.");
    }
  };

  return (
    <Drawer open={open} onClose={onClose} width={720} title={f ? f.title : "Finding"} destroyOnClose>
      {error && <Alert type="error" showIcon message={error} />}
      {!f && !error && <Skeleton active />}
      {f && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Space wrap>
            <Tag color={STATUS[f.status]?.color}>{STATUS[f.status]?.label || f.status}</Tag>
            <Tag color={SEVERITY[f.severity]?.color}>{SEVERITY[f.severity]?.label || f.severity}</Tag>
            {f.reported_severity !== f.severity && <Text type="secondary">reported as {f.reported_severity}</Text>}
            <Tag>{f.area}</Tag>
            <Tag>{f.kind}</Tag>
            <Text type="secondary" copyable={{ text: f.id }}>{f.id}</Text>
            <Button size="small" icon={<CopyOutlined />} onClick={copyPrompt}>Copy for Claude</Button>
          </Space>

          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Summary"><Plain>{f.summary}</Plain></Descriptions.Item>
            {Array.isArray(f.steps_json) && f.steps_json.length > 0 && (
              <Descriptions.Item label="Steps">
                <ol style={{ margin: 0, paddingLeft: 18 }}>{f.steps_json.map((s, i) => <li key={i}>{String(s)}</li>)}</ol>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Expected"><Plain>{f.expected}</Plain></Descriptions.Item>
            <Descriptions.Item label="Actual"><Plain>{f.actual}</Plain></Descriptions.Item>
            {f.evidence && <Descriptions.Item label="Evidence"><Plain>{f.evidence}</Plain></Descriptions.Item>}
            {f.suggested_fix && <Descriptions.Item label="Suggested fix"><Plain>{f.suggested_fix}</Plain></Descriptions.Item>}
            <Descriptions.Item label="Where">
              <Plain>{[where.repo && `Repo: ${where.repo}`, where.paths?.length && `Files: ${where.paths.join(", ")}`,
                where.pages?.length && `Pages: ${where.pages.join(", ")}`, where.endpoints?.length && `Endpoints: ${where.endpoints.join(", ")}`]
                .filter(Boolean).join("\n")}</Plain>
            </Descriptions.Item>
            <Descriptions.Item label="Affects"><Plain>{f.roles?.split(",").join(", ")}</Plain></Descriptions.Item>
            <Descriptions.Item label="Seen on">{f.environment}</Descriptions.Item>
            <Descriptions.Item label="Reported">
              {String(f.found_by_agent)}{f.found_by_session ? ` · ${String(f.found_by_session)}` : ""} · {istTime(f.found_at)}
            </Descriptions.Item>
            {f.duplicate_of && <Descriptions.Item label="Duplicate of">{f.duplicate_of}</Descriptions.Item>}
            <Descriptions.Item label="Fix commits">
              {Array.isArray(f.fix_commits_json) && f.fix_commits_json.length
                ? f.fix_commits_json.map((c) => <Tag key={`${c.repo}@${c.sha}`}>{`${c.repo} ${String(c.sha).slice(0, 8)}`}</Tag>)
                : <Text type="secondary">None yet</Text>}
            </Descriptions.Item>
          </Descriptions>

          {data.similar?.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message="Looks similar"
              description={data.similar.map((s) => <div key={s.id}><Text code>{s.id}</Text> {String(s.title)} ({STATUS[s.status]?.label || s.status})</div>)}
            />
          )}

          <div>
            <Text strong>Change status</Text>
            <Space wrap style={{ width: "100%", marginTop: 8 }}>
              <Select
                style={{ width: 200 }}
                placeholder="New status"
                value={nextStatus}
                onChange={setNextStatus}
                options={nextStatuses(f.status).map((s) => ({ value: s, label: STATUS[s].label }))}
              />
              {nextStatus === "duplicate" && (
                <Select
                  style={{ width: 260 }}
                  placeholder="Duplicate of…"
                  value={duplicateOf || undefined}
                  onChange={setDuplicateOf}
                  options={(data.similar || []).map((s) => ({ value: s.id, label: `${s.id} · ${s.title}` }))}
                  showSearch
                  allowClear
                  notFoundContent="Type the id below"
                />
              )}
            </Space>
            {nextStatus === "duplicate" && (
              <Input style={{ marginTop: 8 }} placeholder="Or paste the original's id" value={duplicateOf} onChange={(e) => setDuplicateOf(e.target.value.trim())} />
            )}
            {nextStatus && (
              <Input.TextArea
                style={{ marginTop: 8 }}
                rows={2}
                maxLength={4000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={nextStatus === "verified" ? "What you re-tested, and where (required)" : noteNeeded ? "Why (required)" : "Note (optional)"}
              />
            )}
            {nextStatus && (
              <Button
                type="primary"
                style={{ marginTop: 8 }}
                loading={busy}
                disabled={(noteNeeded && !note.trim()) || (nextStatus === "duplicate" && !duplicateOf)}
                onClick={() => run(() => setAuditFindingStatus(f.id, { status: nextStatus, note, duplicateOf }), () => { setNextStatus(null); setNote(""); setDuplicateOf(""); })}
              >
                Set to {STATUS[nextStatus].label}
              </Button>
            )}
          </div>

          <Space wrap>
            <div>
              <Text strong>Severity</Text>
              <div>
                <Select
                  style={{ width: 160, marginTop: 8 }}
                  value={f.severity}
                  disabled={busy}
                  onChange={(severity) => run(() => setAuditFindingSeverity(f.id, { severity }))}
                  options={SEVERITY_ORDER.map((s) => ({ value: s, label: SEVERITY[s].label }))}
                />
              </div>
            </div>
            <div>
              <Text strong>Assigned to</Text>
              <Space.Compact style={{ marginTop: 8, display: "flex" }}>
                <Input style={{ width: 200 }} maxLength={100} value={assignee} placeholder="Name or agent" onChange={(e) => setAssignee(e.target.value)} />
                <Button disabled={busy || (assignee || "") === (f.assignee || "")} onClick={() => run(() => setAuditFindingAssignee(f.id, { assignee }))}>Save</Button>
              </Space.Compact>
            </div>
          </Space>

          <div>
            <Text strong>Link a fix commit</Text>
            <Space.Compact style={{ marginTop: 8, display: "flex" }}>
              <Select style={{ width: 120 }} value={commit.repo} onChange={(repo) => setCommit((c) => ({ ...c, repo }))} options={REPOS.map((r) => ({ value: r, label: r }))} />
              <Input style={{ width: 220 }} placeholder="Commit hash" value={commit.sha} onChange={(e) => setCommit((c) => ({ ...c, sha: e.target.value.trim() }))} />
              <Button disabled={busy || !/^[0-9a-f]{7,40}$/.test(commit.sha)} onClick={() => run(() => linkAuditFindingCommit(f.id, commit), () => setCommit((c) => ({ ...c, sha: "" })))}>Link</Button>
            </Space.Compact>
          </div>

          <div>
            <Text strong>Comment</Text>
            <Input.TextArea style={{ marginTop: 8 }} rows={2} maxLength={4000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add to the history" />
            <Button style={{ marginTop: 8 }} disabled={busy || !comment.trim()} onClick={() => run(() => commentOnAuditFinding(f.id, { note: comment }), () => setComment(""))}>Add comment</Button>
          </div>

          <div>
            <Text strong>History</Text>
            {data.events?.length ? (
              <Timeline
                style={{ marginTop: 12 }}
                items={data.events.map((e) => ({
                  key: e.id,
                  color: e.actorKind === "AGENT" ? "gray" : "blue",
                  children: (
                    <div>
                      <Text strong>{EVENT_LABEL[e.type] || e.type}</Text> <Text>{eventText(e)}</Text>
                      <div><Text type="secondary">{String(e.actor)} · {istTime(e.at)}{e.sourceFile ? ` · ${String(e.sourceFile)}` : ""}</Text></div>
                      {e.note && <Plain>{e.note}</Plain>}
                    </div>
                  ),
                }))}
              />
            ) : <Empty description="No history" />}
          </div>
        </Space>
      )}
    </Drawer>
  );
}
