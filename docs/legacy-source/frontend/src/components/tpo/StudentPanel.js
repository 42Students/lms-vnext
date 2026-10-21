import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Alert, Button, Descriptions, Drawer, Empty, Input, List, Modal, Progress, Select, Space, Tabs, Tag, Timeline, Tooltip, Typography, message } from "antd";
import { CheckCircleFilled, ClockCircleOutlined, CommentOutlined, LeftOutlined, RightOutlined, StopOutlined } from "@ant-design/icons";
import RequestsPanel from "@/components/tpo/RequestsPanel";
import { addStudentNote, getStudentDetail, registerStudent } from "@/api/Services/TpoHubService";
import { liftDebarment } from "@/api/Services/TpoService";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { fullName } from "./tpoFiles";
import { dj } from "./dj";
import { PanelError } from "@/components/Common/PanelStates";
import { DetailSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import { formatWhen } from "./ui/formatWhen";
import { actionText, label } from "./ui/labels";
import { safeHref } from "@/utils/safeHref";
import useChoices from "@/hooks/useChoices";
import { OUTCOME_DETAIL_HINT } from "@/config/choices";
import { PROFILE, STAGE } from "./students/studentGridRules";
import { markNote, markOf, pctText } from "./students/academics";
import { ASKS_DETAIL, OutcomePill, REGISTRATION, WORKED_OUT, outcomeNote, registrationOptions, registrationValue } from "./students/outcomes";
import { DECISION, levelText } from "./batches/batchRules";
import AsyncModal from "@/components/tpo/ui/AsyncModal";
import { Fact, Facts } from "@/components/Common/Facts";

const when = (v) => formatWhen(v);
const day = (v) => formatWhen(v, { time: false });
const MARK_LEVELS = [["10TH", "10th"], ["12TH_OR_DIPLOMA", "12th / Diploma"], ["UG", "UG"], ["PG", "PG"]];
const SECTION_NAME = { EDUCATION: "Education", IDENTITY: "Identity" };
// Where an application is, at a glance: moving (blue), offered or placed (green), on hold (gold), out (grey).
const STAGE_COLOR = { APPLIED: "blue", SHORTLISTED: "cyan", ASSESSMENT: "geekblue", INTERVIEW: "geekblue", OFFERED: "green", HIRED: "green", WAITLISTED: "gold", REJECTED: "default", WITHDRAWN: "default" };
const OFFER_GOOD = ["RELEASED", "ACCEPTED", "VERIFIED"];

/** One level's mark as the Students page counts it: the % (or the grade), verified or not, how it was counted on hover. */
function Mark({ row, level }) {
  const m = markOf(row, level);
  if (!m) return <Typography.Text type="secondary">Not provided</Typography.Text>;
  const shown = m.pct === null || m.pct === undefined ? m.shown : `${pctText(m.pct)}${m.converted ? ` (${m.shown})` : ""}`;
  return (
    <Tooltip title={markNote(m)}>
      <span>{shown} <Tag bordered={false} color={m.verified === false ? "gold" : "green"}>{m.verified === false ? "Not verified" : "Verified"}</Tag></span>
    </Tooltip>
  );
}

/** A debarment's state today: lifted, run out (a date in the past) or still active. */
function debarState(d) {
  if (d.liftedAt) return { text: `Lifted ${day(d.liftedAt)}`, color: "default", active: false };
  if (d.untilDate && dj(d.untilDate).endOf("day").isBefore(dj())) return { text: `Ended ${day(d.untilDate)}`, color: "default", active: false };
  return { text: "Active", color: "red", active: true };
}
const debarUntil = (d) => (d.untilDate ? `until ${day(d.untilDate)}` : `for ${d.untilDrives} drive${Number(d.untilDrives) === 1 ? "" : "s"}`);

/** What happened to this student, newest first: the placement cell's own log plus what the record itself shows. */
function historyOf(data, row) {
  const events = (data.history || []).map((h) => ({ at: h.createdAt, title: actionText(h.action), detail: h.detail, who: h.actorName }));
  for (const a of data.applications || []) {
    if (a.appliedAt) events.push({ at: a.appliedAt, title: a.appliedByCollege ? "Added to a drive by the college" : "Applied to a drive", detail: `${a.companyName} · ${a.jobTitle}` });
    if (a.stageChangedAt && a.stage !== "APPLIED" && String(a.stageChangedAt) !== String(a.appliedAt)) {
      events.push({ at: a.stageChangedAt, title: `${label("stage", a.stage)} in a drive`, detail: `${a.companyName} · ${a.jobTitle}` });
    }
  }
  const reg = (data.registration || [])[0];
  if (reg?.consentAt && reg.source === "SELF") events.push({ at: reg.consentAt, title: "Registered for placements", who: "Student" });
  if (row?.eligibilityAt && row?.eligibility) {
    events.push({ at: row.eligibilityAt, title: `${DECISION[row.eligibility]?.label || "Placement decision"} for placements (${levelText(row.eligibilityLevel) || "decision"})`,
      detail: row.eligibilityReason || null, who: row.eligibilityBy });
  }
  return events.filter((e) => dj(e.at).isValid()).sort((x, y) => dj(y.at).valueOf() - dj(x.at).valueOf());
}

function Section({ title, extra, children }) {
  return (
    <section className="tpo-student-panel__section">
      <div className="tpo-student-panel__section-head"><Typography.Text strong>{title}</Typography.Text>{extra}</div>
      {children}
    </section>
  );
}

/**
 * The shared student panel (TPO V1 - Locked.docx §1): who the student is, what needs doing about them, then Profile, Placement,
 * Requests, Notes and History. Opens from Students, Applicants, Offers and Drive day. Previous / Next walk the list it was opened
 * from. Opened inside a drive, a "This drive" line comes first. Marks, After college, the profile check, eligibility and the offer
 * count come from the student's Students-page row (detail.row), so the panel and the page always say the same thing.
 */
export default function StudentPanel({ learnerId, jobId, onClose, onPrev, onNext, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState("profile");
  const [ask, setAsk] = useState(null); // { choice, label, detail } for outcomes that ask what exactly
  const { outcomeLabels } = useChoices();
  const options = useMemo(() => registrationOptions(outcomeLabels), [outcomeLabels]);
  const [noteSaving, setNoteSaving] = useState(false);
  const [registrationSaving, setRegistrationSaving] = useState(false);
  const [liftingDebarmentId, setLiftingDebarmentId] = useState(null);
  const loadSeqRef = useRef(0);
  const noteSavingRef = useRef(false);
  const registrationSavingRef = useRef(false);
  const liftingRef = useRef(false);

  const load = useCallback(async () => {
    if (!learnerId) return;
    const requestId = ++loadSeqRef.current;
    setLoading(true);
    const res = await fetchWithErrorHandling(getStudentDetail(learnerId));
    if (requestId !== loadSeqRef.current) return;
    setLoading(false);
    if (!res.success) { setLoadError(res?.data?.message || res?.data?.error || "We couldn't open this student"); return; }
    setLoadError(null);
    setData(res.data);
  }, [learnerId]);
  // A different student starts on the first tab with nothing of the last one left on screen.
  useEffect(() => { setData(null); setLoadError(null); setTab("profile"); load(); }, [load]);

  const p = data?.profile;
  const row = data?.row || null;
  const applications = data?.applications || [];
  const thisDrive = applications.find((a) => jobId && String(a.jobId) === String(jobId));
  const prepTotal = (data?.prep || []).reduce((sum, x) => sum + (Number(x.total) || 0), 0);
  const prepDone = (data?.prep || []).reduce((sum, x) => sum + (Number(x.done) || 0), 0);
  const prepPct = prepTotal ? Math.round((prepDone * 100) / prepTotal) : null;
  const profile = PROFILE[row?.profileStatus] || null;
  const stage = STAGE[row?.stage] || null;
  const workedOut = WORKED_OUT.includes(row?.status);
  const decision = row?.eligibility ? DECISION[row.eligibility] || DECISION.NOT_DECIDED : null;
  const activeDebarments = (data?.debarments || []).filter((d) => debarState(d).active);
  const pendingRequests = (data?.requests || []).filter((r) => r.status === "PENDING").length;
  const history = useMemo(() => (data ? historyOf(data, row) : []), [data, row]);
  // The branch is usually the program's own name ("CSE" in "B.Tech CSE"): said once.
  const where = p ? [row?.programName || p.branch, row?.className, row?.batchName || p.batch].filter(Boolean)
    .concat(row?.programName && p.branch && !String(row.programName).toLowerCase().includes(String(p.branch).toLowerCase()) ? [p.branch] : [])
    .join(" · ") : "";

  const addNote = async () => {
    if (!note.trim() || noteSavingRef.current) return;
    noteSavingRef.current = true;
    setNoteSaving(true);
    try {
      const res = await fetchWithErrorHandling(addStudentNote(learnerId, note.trim()));
      if (!res.success) { message.error(res?.data?.message || "Could not save the note"); return; }
      setNote("");
      message.success("Note added");
      await load();
      onChanged?.();
    } finally {
      noteSavingRef.current = false;
      setNoteSaving(false);
    }
  };
  const save = async (choice, choiceLabel, detail) => {
    if (registrationSavingRef.current) return false;
    registrationSavingRef.current = true;
    setRegistrationSaving(true);
    try {
      const res = await fetchWithErrorHandling(registerStudent(learnerId, choice, choiceLabel, detail));
      if (!res.success) { message.error(res?.data?.message || res?.data?.error || "Could not save After college"); return false; }
      // Reconcile immediately so a failed follow-up refresh cannot leave the old choice looking current.
      setData((current) => current ? { ...current, row: current.row ? { ...current.row, registration: choice, outcomeLabel: choiceLabel || null, outcomeDetail: detail || null } : current.row } : current);
      message.success(`After college: ${choiceLabel || REGISTRATION[choice]}`);
      await load();
      onChanged?.();
      return true;
    } finally {
      registrationSavingRef.current = false;
      setRegistrationSaving(false);
    }
  };

  const confirmDiscardNoteThen = (action) => {
    if (!note.trim()) {
      action?.();
      return;
    }
    Modal.confirm({
      title: "Discard this private note?",
      content: "The note has not been saved yet.",
      okText: "Discard note",
      okButtonProps: { danger: true },
      cancelText: "Keep writing",
      onOk: () => {
        setNote("");
        action?.();
      },
    });
  };
  // The same as the Students page: Entrepreneurship and Competitive exams ask what exactly (optional); the rest save at once.
  // The college's label goes with the choice, so changing it here no longer wipes the label and detail.
  const choose = (value) => {
    if (registrationSavingRef.current) return;
    const [choice, choiceLabel = null] = String(value).split("|");
    if (ASKS_DETAIL.includes(choice)) { setAsk({ choice, label: choiceLabel, detail: row?.registration === choice ? row?.outcomeDetail || "" : "" }); return; }
    save(choice, choiceLabel, null);
  };
  const lift = (d) => {
    if (!d?.id || liftingRef.current) return;
    Modal.confirm({
      title: "Lift this debarment?", content: `${d.reason}. The student can apply to drives again straight away and is told.`, okText: "Lift",
      onOk: async () => {
        if (liftingRef.current) return;
        liftingRef.current = true;
        setLiftingDebarmentId(d.id);
        try {
          const res = await fetchWithErrorHandling(liftDebarment(d.id, "Lifted by the placement cell"));
          if (!res.success) { message.error(res?.data?.message || "Could not lift it"); return; }
          setData((current) => current ? {
            ...current,
            debarments: (current.debarments || []).map((item) => Number(item.id) === Number(d.id)
              ? { ...item, liftedAt: new Date().toISOString() }
              : item),
          } : current);
          message.success("Debarment lifted");
          await load();
          onChanged?.();
        } finally {
          liftingRef.current = false;
          setLiftingDebarmentId(null);
        }
      },
    });
  };

  // What needs doing about this student, most serious first. Each says what it is and where to act.
  const attention = !p ? [] : [
    ...activeDebarments.map((d) => ({ key: `debar-${d.id}`, tone: "error", icon: <StopOutlined />, text: `Debarred ${debarUntil(d)}: ${d.reason}`,
      action: <Button size="small" loading={Number(liftingDebarmentId) === Number(d.id)} disabled={liftingDebarmentId != null} onClick={() => lift(d)}>Lift</Button> })),
    ...(row?.eligibility === "INELIGIBLE" ? [{ key: "ineligible", tone: "error", icon: <StopOutlined />,
      text: `Out of placements (${levelText(row.eligibilityLevel) || "decision"})${row.eligibilityReason ? `: ${row.eligibilityReason}` : ""}`,
      action: <Link href={row.batchId ? `/tpo/batches/${row.batchId}` : "/tpo/batches"}>Placement eligibility</Link> }] : []),
    ...(pendingRequests ? [{ key: "requests", tone: "warning", icon: <ClockCircleOutlined />, text: `${pendingRequests} request${pendingRequests === 1 ? "" : "s"} waiting for your decision`,
      action: <Button size="small" onClick={() => setTab("requests")}>Decide</Button> }] : []),
    ...((row?.waitingSections || []).length ? [{ key: "verify", tone: "warning", icon: <ClockCircleOutlined />,
      text: `${row.waitingSections.map((s) => SECTION_NAME[s] || s).join(" and ")} waiting for you to verify`,
      action: <Link href="/tpo/verification">Verify</Link> }] : []),
    ...(Number(row?.offersWaiting) > 0 ? [{ key: "offers", tone: "warning", icon: <ClockCircleOutlined />,
      text: `${row.offersWaiting} offer${Number(row.offersWaiting) === 1 ? " is" : "s are"} waiting for their answer`, action: <Button size="small" onClick={() => setTab("placement")}>See</Button> }] : []),
  ];

  return (
    <Drawer className="tpo-student-panel" open={Boolean(learnerId)} onClose={() => confirmDiscardNoteThen(onClose)} width={680} destroyOnClose
      aria-busy={loading ? "true" : undefined}
      title={(
        <div className="tpo-student-panel__title">
          <span className="tpo-student-panel__name">{p ? [fullName({ firstName: p.firstName, lastName: p.lastName }), p.rollNumber].filter(Boolean).join(" · ") : "Student"}</span>
          {p && <span className="tpo-student-panel__where">{where || "No program or class yet"}</span>}
        </div>
      )}
      extra={<Space size={6}>
        {/* Team module V1: the team's conversation about this student (one per student). */}
        {p && <Link href={`/tpo/messages?tab=team&about=${encodeURIComponent(`STUDENT:${learnerId}`)}`} className="ant-btn ant-btn-default tpo-student-panel__team"
          aria-label={`Talk about ${p.firstName || "this student"} with the team`} title={`Talk about ${p.firstName || "this student"} with the team`}><CommentOutlined /> Team</Link>}
        <Button icon={<LeftOutlined />} disabled={!onPrev || noteSaving || registrationSaving || liftingDebarmentId != null} onClick={() => confirmDiscardNoteThen(onPrev)} aria-label="Previous student" />
        <Button icon={<RightOutlined />} disabled={!onNext || noteSaving || registrationSaving || liftingDebarmentId != null} onClick={() => confirmDiscardNoteThen(onNext)} aria-label="Next student" /></Space>}>
      {loading && !data && <DetailSkeleton label="Loading student details" withMedia={false} />}
      {loadError && !data && !loading && <PanelError title={loadError} onRetry={load} />}
      {loading && data && <RefreshStatus label="Refreshing student details…" />}
      {loadError && data && !loading && (
        <Alert type="warning" showIcon style={{ marginBottom: 12 }} message="Student details may be stale" description={loadError}
          action={<Button size="small" onClick={load}>Retry</Button>} />
      )}
      {p && (
        <>
          {thisDrive && (
            <Alert type="info" showIcon className="tpo-student-panel__drive"
              message={`This drive: ${label("stage", thisDrive.stage)}${thisDrive.appliedByCollege ? " · added by the college" : ""}${thisDrive.offerStatus ? ` · offer ${label("offer", thisDrive.offerStatus).toLowerCase()}` : ""}`} />
          )}
          <div className="tpo-student-panel__hero">
            {/* Each fact says what it is: a bare "Eligible" chip next to a bare "Not decided yet" left the reader guessing. */}
            <Facts className="tpo-student-panel__facts" testid="student-panel.status">
              {stage && (
                <Fact label="Stage" hint="Their step in placements: Eligible, Invited, Registered, Verified, Placed">
                  <Tag color={stage.color} bordered={false} data-testid="student-panel.stage">{stage.label}</Tag>
                </Fact>
              )}
              {decision && (
                <Fact label="Placements" hint={["Whether they take part in placements", row.eligibilityBy && `decided by ${row.eligibilityBy}`, row.eligibilityAt && day(row.eligibilityAt)].filter(Boolean).join(", ")}>
                  <Tag bordered={false} color={decision.color} data-testid="student-panel.eligibility">
                    {decision.label}{row.eligibilityLevel ? ` (${levelText(row.eligibilityLevel)})` : ""}
                  </Tag>
                </Fact>
              )}
              {row?.outcome && <Fact label="After college" hint="What they plan after college. Change it in Profile."><OutcomePill row={row} /></Fact>}
              {row?.debarred && <Fact label="Drives"><Tag bordered={false} color="red">Debarred</Tag></Fact>}
            </Facts>
            <div className="tpo-student-panel__metrics">
              <button type="button" onClick={() => setTab("placement")}><span>Applications</span><strong>{row ? row.applications : applications.length}</strong></button>
              <button type="button" onClick={() => setTab("placement")}><span>Offers</span><strong data-testid="student-panel.offers">{row ? row.offers : "-"}</strong></button>
              <button type="button" onClick={() => setTab("profile")}><span>Profile check</span><strong className={`is-${String(row?.profileStatus || "").toLowerCase()}`}>{profile ? profile[0] : "-"}</strong></button>
              <button type="button" onClick={() => setTab("placement")}><span>Prep</span><strong>{prepPct == null ? "None" : `${prepPct}%`}</strong></button>
            </div>
          </div>

          {attention.length > 0 && (
            <ul className="tpo-student-panel__attention" aria-label="Needs attention" data-testid="student-panel.attention">
              {attention.map((a) => (
                <li key={a.key} className={`is-${a.tone}`}><span className="tpo-student-panel__attention-icon">{a.icon}</span><span className="tpo-student-panel__attention-text">{a.text}</span>{a.action}</li>
              ))}
            </ul>
          )}

          <Tabs activeKey={tab} onChange={setTab} items={[
            {
              key: "profile", label: "Profile",
              children: (
                <>
                  <Section title="Marks">
                    <Descriptions column={1} size="small" bordered>
                      {MARK_LEVELS.filter(([level]) => level !== "PG" || markOf(row, "PG")).map(([level, name]) => (
                        <Descriptions.Item key={level} label={name}><Mark row={row} level={level} /></Descriptions.Item>
                      ))}
                    </Descriptions>
                  </Section>
                  <Section title="Ready for drives">
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label="Status">
                        {row?.readiness === "READY" ? <span className="tpo-student-panel__ok"><CheckCircleFilled /> Ready</span> : row?.readinessNote || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Resume">{safeHref(p.resumeUrl) ? <a href={safeHref(p.resumeUrl)} target="_blank" rel="noreferrer">Open resume</a> : p.resumeUrl ? "The resume link is not a web address" : <Typography.Text type="secondary">No resume uploaded</Typography.Text>}</Descriptions.Item>
                      <Descriptions.Item label="Coding profiles">
                        {(p.codingProfiles || []).filter((c) => safeHref(c.url)).length
                          ? (p.codingProfiles || []).filter((c) => safeHref(c.url)).map((c, i) => (
                            <span key={c.key}>{i > 0 && " · "}<a href={safeHref(c.url)} target="_blank" rel="noreferrer">{c.label}: {c.username}</a></span>
                          ))
                          : <Typography.Text type="secondary">None added</Typography.Text>}
                      </Descriptions.Item>
                    </Descriptions>
                  </Section>
                  <Section title="Contact">
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label="Email">{p.email ? <Typography.Text copyable={{ text: p.email, tooltips: ["Copy email", "Copied"] }}><a href={`mailto:${p.email}`}>{p.email}</a></Typography.Text> : <Typography.Text type="secondary">Not provided</Typography.Text>}</Descriptions.Item>
                      <Descriptions.Item label="Phone">{p.phone ? <Typography.Text copyable={{ text: p.phone, tooltips: ["Copy phone", "Copied"] }}><a href={`tel:${p.phone}`}>{p.phone}</a></Typography.Text> : <Typography.Text type="secondary">Not provided</Typography.Text>}</Descriptions.Item>
                    </Descriptions>
                  </Section>
                  <Section title="After college">
                    {workedOut ? (
                      <Space direction="vertical" size={2}>
                        <OutcomePill row={row} />
                        <Typography.Text type="secondary">{row.status === "PLACED" ? "Worked out from their accepted offer." : "Worked out from an active debarment."}</Typography.Text>
                      </Space>
                    ) : (
                      <Space direction="vertical" size={4} style={{ width: "100%" }}>
                        <Select value={registrationValue(row)} placeholder="Not decided yet" style={{ width: 300, maxWidth: "100%" }} onChange={choose}
                          loading={registrationSaving} disabled={registrationSaving}
                          options={options} aria-label="After college" data-testid="student-panel.after-college" />
                        {outcomeNote(row) && <Typography.Text type="secondary">{outcomeNote(row)}</Typography.Text>}
                      </Space>
                    )}
                  </Section>
                  <AsyncModal open={Boolean(ask)} title={ask ? `After college: ${ask.label || REGISTRATION[ask.choice]}` : ""} okText="Save" onCancel={() => setAsk(null)}
                    onOk={async () => { if (await save(ask.choice, ask.label, ask.detail.trim() || null)) setAsk(null); }}>
                    <Typography.Paragraph type="secondary">What exactly? Optional.</Typography.Paragraph>
                    <Input aria-label="Outcome detail" maxLength={200} value={ask?.detail || ""} placeholder={OUTCOME_DETAIL_HINT[ask?.choice] || ""}
                      onChange={(e) => setAsk({ ...ask, detail: e.target.value })} />
                  </AsyncModal>
                </>
              ),
            },
            {
              key: "placement", label: `Placement${applications.length ? ` (${applications.length})` : ""}`,
              children: (
                <>
                  {decision && (
                    <Section title="Placement eligibility" extra={<Link href={row.batchId ? `/tpo/batches/${row.batchId}` : "/tpo/batches"}>Change</Link>}>
                      <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="Decision"><Tag bordered={false} color={decision.color}>{decision.label}</Tag>{row.eligibilityLevel ? levelText(row.eligibilityLevel) : ""}</Descriptions.Item>
                        {row.eligibilityReason && <Descriptions.Item label="Reason">{row.eligibilityReason}</Descriptions.Item>}
                        {row.eligibilityNote && <Descriptions.Item label="Note">{row.eligibilityNote}</Descriptions.Item>}
                        {(row.eligibilityBy || row.eligibilityAt) && <Descriptions.Item label="Decided">{[row.eligibilityBy, day(row.eligibilityAt)].filter(Boolean).join(", ")}</Descriptions.Item>}
                      </Descriptions>
                    </Section>
                  )}
                  <Section title="Applications and offers">
                    <List className="tpo-student-panel__list" locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No applications yet" /> }}
                      dataSource={applications}
                      renderItem={(a) => {
                        const round = (row?.journey || []).find((j) => String(j.jobId) === String(a.jobId))?.round;
                        return (
                          <List.Item>
                            <List.Item.Meta title={<Link href={`/tpo/drives/${a.jobId}`}>{a.companyName} · {a.jobTitle}</Link>}
                              description={(
                                <Space wrap size={[6, 4]}>
                                  <Tag bordered={false} color={STAGE_COLOR[a.stage] || "default"}>{label("stage", a.stage)}{round ? ` · ${round}` : ""}</Tag>
                                  {a.offerStatus && <Tag bordered={false} color={OFFER_GOOD.includes(a.offerStatus) ? "green" : "default"}>Offer {label("offer", a.offerStatus).toLowerCase()}{a.ctcLpa ? ` · ${a.ctcLpa} LPA` : ""}</Tag>}
                                  {a.appliedByCollege && <Tag bordered={false}>Added by the college</Tag>}
                                  {a.withdrawalReason === "PLACED_ELSEWHERE" && <Tag bordered={false}>Placed elsewhere</Tag>}
                                  {a.appliedAt && <Typography.Text type="secondary">{a.appliedByCollege ? "Added" : "Applied"} {day(a.appliedAt)}</Typography.Text>}
                                </Space>
                              )} />
                          </List.Item>
                        );
                      }} />
                  </Section>
                  {data.prep?.length > 0 && (
                    <Section title="Prep assigned by the placement cell">
                      <List className="tpo-student-panel__list" dataSource={data.prep}
                        renderItem={(x) => (
                          <List.Item>
                            <List.Item.Meta title={x.courseName || `Course ${x.courseId}`}
                              description={<Space wrap><Progress percent={x.total ? Math.round((100 * x.done) / x.total) : 0} size="small" style={{ width: 160 }} /><Typography.Text type="secondary">{x.done}/{x.total} lessons{x.dueAt ? ` · due ${dj(x.dueAt).format("D MMM")}` : ""}</Typography.Text></Space>} />
                          </List.Item>
                        )} />
                    </Section>
                  )}
                  {data.debarments?.length > 0 && (
                    <Section title="Debarments" extra={<Typography.Text type="secondary">Never shown to companies</Typography.Text>}>
                      <List className="tpo-student-panel__list" dataSource={data.debarments}
                        renderItem={(d) => {
                          const s = debarState(d);
                          return (
                            <List.Item actions={s.active ? [<Button key="l" size="small" loading={Number(liftingDebarmentId) === Number(d.id)} disabled={liftingDebarmentId != null} onClick={() => lift(d)}>Lift</Button>] : []}>
                              <List.Item.Meta title={<Space size={6}><Tag bordered={false} color={s.color}>{s.text}</Tag><span>{d.reason}</span></Space>}
                                description={`From ${day(d.createdAt) || "-"}, ${debarUntil(d)}${d.liftedReason ? ` · ${d.liftedReason}` : ""}`} />
                            </List.Item>
                          );
                        }} />
                    </Section>
                  )}
                </>
              ),
            },
            {
              key: "requests",
              label: `Requests${pendingRequests ? ` (${pendingRequests} waiting)` : ""}`,
              children: <RequestsPanel learnerId={learnerId} onChanged={() => { load(); onChanged?.(); }} />,
            },
            {
              key: "notes", label: `Notes${data.notes?.length ? ` (${data.notes.length})` : ""}`,
              children: (
                <>
                  <div className="tpo-student-panel__note-box">
                    <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} aria-label="New note"
                      onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addNote(); } }}
                      placeholder="Private to the placement team. Never shown to the student or companies." />
                    <div className="tpo-student-panel__note-actions">
                      <Typography.Text type="secondary">Ctrl + Enter to add</Typography.Text>
                      <Button type="primary" loading={noteSaving} disabled={!note.trim() || noteSaving} onClick={addNote}>Add note</Button>
                    </div>
                  </div>
                  <List className="tpo-student-panel__list" dataSource={data.notes} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notes yet" /> }}
                    renderItem={(n) => <List.Item><div><div style={{ whiteSpace: "pre-wrap" }}>{n.note}</div><Typography.Text type="secondary">{[n.createdByName, when(n.createdAt)].filter(Boolean).join(" · ")}</Typography.Text></div></List.Item>} />
                </>
              ),
            },
            {
              key: "history", label: "History",
              children: history.length ? (
                <Timeline className="tpo-student-panel__history" items={history.map((h, i) => ({
                  key: i,
                  children: <div><b>{h.title}</b>{h.detail ? ` · ${h.detail}` : ""}<div><Typography.Text type="secondary">{[h.who, when(h.at)].filter(Boolean).join(" · ")}</Typography.Text></div></div>,
                }))} />
              ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing has happened yet" />,
            },
          ]} />
        </>
      )}
    </Drawer>
  );
}
