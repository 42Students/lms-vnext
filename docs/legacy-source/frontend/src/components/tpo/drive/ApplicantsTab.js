import Link from "next/link";
import ReasonPicker, { reasonIsValid } from "../ui/ReasonPicker";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Empty, Form, Input, List, Modal, Segmented, Space, Tag, Tooltip, Typography, message, notification } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import ApplicantReviewModal from "./ApplicantReviewModal";
import ApplicantsBoard from "./ApplicantsBoard";
import { ACTIVE_STAGES, DRIVE_JOURNEY, RESULT_LABEL, STAGE_LABEL, applicantFilterDefs, legacyApplicantFilters, moveConsequence } from "../ui/applicantRules";
import { academicTableColumns } from "../students/academics";
import { dj } from "../dj";
import { safeHref } from "@/utils/safeHref";
import { activeCount, applyFilters } from "../filters/filterModel";
import TpoDataTable from "../TpoDataTable";
import useBulkAction from "../bulk/BulkAction";
import ActionsWindow from "../ui/ActionsWindow";
import JourneyStrip from "../ui/JourneyStrip";
import { fullName } from "../tpoFiles";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { applyOnBehalf, bulkMoveApplicants, bulkRejectApplicants, remindNotApplied, undoBulkAction } from "@/api/Services/TpoService";
import { bulkNote, bulkNudge } from "@/api/Services/TpoHubService";
import { plural } from "@/components/tpo/ui/labels";
import AsyncModal from "@/components/tpo/ui/AsyncModal";
import { StatusBadge } from "@/components/Common/PanelStates";

// Stage pills look like the batch page's: the same badge, coloured by how the student is doing.
const STAGE_TONE = {
  APPLIED: "info", SHORTLISTED: "info", ASSESSMENT: "info", INTERVIEW: "info", WAITLISTED: "warning",
  OFFERED: "success", HIRED: "success", REJECTED: "error", WITHDRAWN: "neutral",
};

const errorText = (res, fallback) => res?.data?.message || res?.data?.error || res?.message || fallback;
const REJECT_REASONS = ["Does not meet the company's criteria", "Profile incomplete", "Not selected by the company", "Duplicate application"];
const DECIDED = ["OFFERED", "HIRED", "REJECTED", "WITHDRAWN"];
const APPLICANT = ["applicant", "applicants"];
// What usually comes next after a gap or a link on the strip: offered in the act bar, never forced.
const SUGGESTED = {
  D_GAP_REVIEW: { text: "review them one by one", review: true },
  D_GAP_BEFORE_INTERVIEW: { text: "move them to interview", action: "interview" },
  D_GAP_DECISION: { text: "enter the round results (Rounds)", rounds: true },
  D_GAP_ANSWER: { text: "remind them to answer the offer", action: "message", values: { text: "You have an offer waiting for your answer. Please accept or decline it before it expires." } },
  D_NO_RESUME: { text: "ask them to upload a resume", action: "message", values: { text: "Please upload your resume to your profile. The company sees it with your application." } },
};

/**
 * Applicants tab (docs/tpo-ux/BEST-VERSION-PROGRAMME-2026-10-05.md): the drive's journey strip (where the applicants are now, and
 * the work between the steps), a lean list (marks are filters and in exports), an always-visible act bar and one Actions window.
 */
export default function ApplicantsTab({ job, applicants, notApplied, reload, onOpenStudent, onShare, requiresCompanyId, readOnly, showRound, onGoRounds, funnel, openNotAppliedAt }) {
  const [filters, setFilters] = useState({});
  // From a round card: "who is in this round" (the tab stays mounted, so this follows every click, not only the first).
  useEffect(() => { if (showRound?.name) setFilters({ round: [showRound.name] }); }, [showRound]);
  const [showNotApplied, setShowNotApplied] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [view, setView] = useState("table");
  const [review, setReview] = useState(null); // rows to review one by one
  const [acting, setActing] = useState(null); // { audience, selected, initial, clear }
  // The page's Next step card can open the "registered, not applied" list directly (its button counts up).
  useEffect(() => { if (openNotAppliedAt) setShowNotApplied(true); }, [openNotAppliedAt]);

  const noCompanyId = useMemo(() => applicants.filter((a) => !a.externalRef && !["REJECTED", "WITHDRAWN"].includes(a.stage)), [applicants]);
  const filterDefs = useMemo(() => applicantFilterDefs(), []);
  const rows = useMemo(() => applyFilters(applicants, filterDefs, filters), [applicants, filterDefs, filters]);

  const run = async (label, call, after) => {
    if (busyRef.current) return null;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await fetchWithErrorHandling(call);
      if (!res.success) { message.error(errorText(res, `${label} failed`)); return null; }
      after?.(res.data);
      reload();
      return res.data;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  // One student's move: when the server left them where they were (already offered, placed, at that stage...), say so, not "Moved".
  const withUndo = (label) => (data) => {
    const id = data?.undoGroupId;
    const left = data?.skipped || [];
    if (!data?.moved && left.length) { message.warning(`Not moved: ${left[0].reason}`); return; }
    notification.success({
      message: label, duration: 8, description: "Students are told after 30 seconds.",
      btn: id ? <Button size="small" onClick={async () => {
        const res = await fetchWithErrorHandling(undoBulkAction(job.id, id));
        notification.destroy();
        if (res.success) message.success("Undone. Nobody was told."); else message.error(errorText(res, "Too late to undo"));
        reload();
      }}>Undo</Button> : null,
    });
  };

  const [startBulk, bulkElement] = useBulkAction();
  // The server keeps each bulk move as one undo group; students are told only after 30 seconds, so an undo in time tells nobody.
  const undoGroup = async (done, res) => (res?.data?.undoGroupId
    ? fetchWithErrorHandling(undoBulkAction(job.id, res.data.undoGroupId))
    : { success: false, data: { message: "This can no longer be undone" } });
  // The students the server left where they were, with its reason (already offered, placed, at that stage...).
  const leftAlone = (res, items) => (res?.data?.skipped || [])
    .map((x) => ({ item: items.find((r) => r.applicationId === x.applicationId), reason: x.reason })).filter((x) => x.item);
  const move = (list, status, clear) => startBulk({
    title: `Move to ${STAGE_LABEL[status]}`, noun: APPLICANT, items: list, nameOf: fullName,
    skip: forwardTo(status),
    consequence: `${moveConsequence(status, list.length)} Students are told after 30 seconds.`,
    undoWhen: "You can undo for 30 seconds, before students are told.",
    run: (items) => fetchWithErrorHandling(bulkMoveApplicants(job.id, items.map((r) => r.applicationId), status)),
    partial: leftAlone,
    undo: undoGroup, onDone: () => { clear?.(); reload(); },
  });
  const reject = (list, why, clear) => startBulk({
    title: "Not selected", noun: APPLICANT, items: list, nameOf: fullName, danger: true,
    // Offered and placed students are handled on the Offers tab; finished ones are already out.
    skip: (r) => (ACTIVE_STAGES.includes(r.stage) ? null : `Already ${(STAGE_LABEL[r.stage] || r.stage).toLowerCase()}`),
    consequence: `${moveConsequence("REJECTED", list.length)} Students are told after 30 seconds.`,
    undoWhen: "You can undo for 30 seconds, before students are told.",
    run: (items) => fetchWithErrorHandling(bulkRejectApplicants(job.id, items.map((r) => r.applicationId), why)),
    partial: leftAlone,
    undo: undoGroup, onDone: () => { clear?.(); reload(); },
  });

  // One student, from the board or the review mode. Moves ask first and name who is told; "Not selected" goes through the reason picker.
  const moveOne = (row, to) => {
    if (readOnly) return;
    if (to === "REJECTED") { setReason(""); setRejecting({ row }); return; }
    Modal.confirm({
      title: `Move ${fullName(row)} to ${STAGE_LABEL[to]}?`, content: moveConsequence(to, 1), okText: "Move",
      onOk: () => run("Move", bulkMoveApplicants(job.id, [row.applicationId], to), withUndo(`Moved ${fullName(row)} to ${STAGE_LABEL[to]}`)),
    });
  };
  // The review card is marked decided only when the server really moved the student (it leaves offered and placed ones alone).
  const reviewShortlist = async (row) => {
    if (readOnly) return false;
    return Number((await run("Move", bulkMoveApplicants(job.id, [row.applicationId], "SHORTLISTED"), withUndo(`Shortlisted ${fullName(row)}`)))?.moved) > 0;
  };
  const reviewReject = async (row) => {
    if (readOnly) return false;
    return Number((await run("Reject", bulkRejectApplicants(job.id, [row.applicationId], "Not selected by the company"), withUndo(`Not selected: ${fullName(row)}`)))?.moved) > 0;
  };

  // ---- the strip ------------------------------------------------------------------------------------------------------------
  const picked = (filters.djourney || []).length === 1 ? filters.djourney[0] : null;
  const pick = (key) => {
    if (key === "D_CAN") { setFilters((f) => { const n = { ...f }; delete n.djourney; return n; }); return; }
    if (key === "D_NOT_APPLIED") { setShowNotApplied(true); return; }
    setFilters((f) => { const n = { ...f }; delete n.djourney; if (key !== picked) n.djourney = [key]; return n; });
  };
  const strip = useMemo(() => {
    const n = (j) => applicants.filter((r) => j.test(r)).length;
    // How many ever got this far (the server's funnel counts every application that reached a stage, even if rejected later).
    const ever = Object.fromEntries((funnel || []).map((f) => [f.stage, Number(f.count) || 0]));
    const reached = { D_SHORTLISTED: ever.SHORTLISTED, D_INTERVIEW: ever.INTERVIEW, D_OFFERED: ever.OFFERED, D_PLACED: ever.HIRED };
    // "Registered and eligible": eligible students who registered for placements (applied + not applied). About shows all the rules let in.
    const steps = [{ key: "D_CAN", label: "Registered and eligible", n: applicants.length + notApplied.length, all: true },
      ...DRIVE_JOURNEY.filter((j) => j.step).map((j) => ({ key: j.key, label: j.label, n: n(j), reached: reached[j.key] }))];
    const gaps = Object.fromEntries(DRIVE_JOURNEY.filter((j) => j.after).map((j) => [j.after, { key: j.key, label: j.label, n: n(j) }]));
    if (!job.recordedOutside) gaps.D_CAN = { key: "D_NOT_APPLIED", label: "Not applied", n: notApplied.length };
    return { steps, gaps, extras: DRIVE_JOURNEY.filter((j) => j.extra).map((j) => ({ key: j.key, label: j.label, n: n(j) })) };
  }, [applicants, notApplied, job.recordedOutside, funnel]);
  const narrowedBy = activeCount(filterDefs.filter((d) => d.key !== "djourney"), filters);

  // ---- the Actions window ---------------------------------------------------------------------------------------------------
  const notDecided = (r) => (DECIDED.includes(r.stage) ? `${STAGE_LABEL[r.stage]} already` : null);
  // Moves from here only go forward: someone at Interview is never "shortlisted" again. Waitlisted applicants were put there by a
  // round result; moving them is a decision for the board (one at a time), not a bulk move.
  const RANK = { APPLIED: 0, SHORTLISTED: 1, ASSESSMENT: 2, INTERVIEW: 3 };
  const forwardTo = (to) => (r) => notDecided(r)
    || (r.stage === "WAITLISTED" ? "Waitlisted by a round result: decide on the board" : null)
    || (r.stage === to ? `Already ${STAGE_LABEL[to]}` : null)
    || ((RANK[r.stage] ?? -1) > RANK[to] ? `Already past this (${STAGE_LABEL[r.stage]})` : null);
  const actions = [
    { group: "Move", key: "shortlist", title: "Shortlist", help: "They are told they are shortlisted. Only moves forward: anyone further along is skipped.", skip: forwardTo("SHORTLISTED"),
      run: (list) => move(list, "SHORTLISTED", acting?.clear) },
    { group: "Move", key: "test", title: "Move to test", help: "They are told about the test. Only moves forward: anyone at interview is skipped.", skip: forwardTo("ASSESSMENT"),
      run: (list) => move(list, "ASSESSMENT", acting?.clear) },
    { group: "Move", key: "interview", title: "Move to interview", help: "They move to the interview stage and are told.", skip: forwardTo("INTERVIEW"),
      run: (list) => move(list, "INTERVIEW", acting?.clear) },
    { group: "Move", key: "reject", title: "Not selected", danger: true, help: "They are told they were not selected. Your reason stays inside the placement cell.",
      // Counted the way the confirmation counts: offered, placed and finished applicants are not in play here.
      skip: (r) => notDecided(r) || (ACTIVE_STAGES.includes(r.stage) ? null : `Already ${(STAGE_LABEL[r.stage] || r.stage).toLowerCase()}`),
      fields: <Form.Item name="reason" label="Reason (inside the placement cell)" rules={[{ validator: (_, v) => (reasonIsValid(v || "", REJECT_REASONS) ? Promise.resolve() : Promise.reject(new Error("Pick or write the reason"))) }]}>
        <ReasonPicker reasons={REJECT_REASONS} placeholder="Internal reason" /></Form.Item>,
      run: (list, v) => reject(list, v.reason.trim(), acting?.clear) },
    { group: "Move", key: "review", title: "Review one by one", help: "Their profile, resume and marks one at a time, with Shortlist and Not selected.",
      skip: (r) => (["APPLIED", "SHORTLISTED"].includes(r.stage) ? null : "Already past shortlisting"), button: (n) => `Review ${plural(n, "applicant")}`,
      run: (list) => setReview(list) },
    { group: "Talk to them", key: "message", title: "Send a message", help: "They see it in the app (and by email once 42LMS switches placement emails on).",
      fields: <Form.Item name="text" rules={[{ required: true, whitespace: true, message: "Write the message" }]}><Input.TextArea rows={4} maxLength={1000} placeholder={`About ${job.companyName}…`} /></Form.Item>,
      run: (list, v) => startBulk({ title: "Send message", noun: APPLICANT, items: list, nameOf: fullName, consequence: `They see: "${v.text.trim()}"`, undoNote: "A sent message cannot be taken back.",
        run: (items) => fetchWithErrorHandling(bulkNudge(items.map((r) => r.learnerId), v.text.trim())), onDone: () => { acting?.clear?.(); reload(); } }) },
    { group: "Company and notes", key: "share", title: "Share with the company", whole: true,
      help: `Send ${job.companyName} a link to this drive's applicant list. The next window decides who is in it (everyone, or the top of the list) and which columns; the rows ticked or filtered here do not narrow it.`,
      button: () => "Choose what to share…", run: () => onShare?.() },
    { group: "Company and notes", key: "note", title: "Add a note", help: "The same note on each student's record, for the placement team only.",
      fields: <Form.Item name="note" rules={[{ required: true, whitespace: true, message: "Write the note" }]}><Input.TextArea rows={3} maxLength={1000} placeholder={`e.g. ${job.companyName} asked for their portfolio`} /></Form.Item>,
      run: (list, v) => startBulk({ title: "Add note", noun: APPLICANT, items: list, nameOf: fullName, consequence: `"${v.note.trim()}" is added to each student's record.`, undoNote: "Notes stay on the record.",
        run: (items) => fetchWithErrorHandling(bulkNote(items.map((r) => r.learnerId), v.note.trim())), onDone: () => { acting?.clear?.(); reload(); } }) },
  ].map((a) => ({ ...a, danger: a.danger, run: readOnly ? () => {} : a.run }));

  const act = (shown, selected, clear) => {
    const audience = selected.length ? selected : shown;
    const tip = !selected.length && picked && SUGGESTED[picked];
    const doTip = () => {
      if (tip.review) { setReview(shown.filter((r) => ["APPLIED", "SHORTLISTED"].includes(r.stage))); return; }
      if (tip.rounds) { onGoRounds?.(); return; }
      setActing({ audience: shown, selected: false, initial: { action: tip.action, values: tip.values }, clear });
    };
    return (
      <>
        <span className="tpo-elig__act-text">
          {selected.length ? <><strong>{selected.length.toLocaleString()}</strong> selected of {shown.length.toLocaleString()}</> : <><strong>{shown.length.toLocaleString()}</strong> {shown.length === 1 ? "applicant" : "applicants"} in this view</>}
        </span>
        <Button type={selected.length ? "primary" : "default"} icon={<ThunderboltOutlined />} style={audience.length === 0 ? { display: "none" } : undefined} disabled={audience.length === 0 || readOnly} data-testid="applicants.act"
          onClick={() => setActing({ audience, selected: selected.length > 0, initial: null, clear })}>
          {selected.length ? `Act on ${selected.length.toLocaleString()} selected` : `Act on all ${shown.length.toLocaleString()}`}
        </Button>
        {tip && shown.length > 0 && (
          <span className="tpo-elig__suggest" data-testid="applicants.suggest">
            Suggested: {tip.text}
            <Button size="small" disabled={readOnly} onClick={doTip} data-testid="applicants.suggest-do">{tip.rounds ? "Go to Rounds" : "Do it"}</Button>
          </span>
        )}
      </>
    );
  };

  const columns = [
    { title: "Name", key: "name", render: (_, r) => <Button type="link" size="small" style={{ padding: 0, height: "auto" }} onClick={() => onOpenStudent(r.learnerId, rows.findIndex((x) => x.learnerId === r.learnerId))}>{fullName(r) || `#${r.learnerId}`}</Button>, exportValue: fullName },
    { title: "Roll", dataIndex: "rollNumber", sortable: true, key: "roll" },
    { title: "Batch", dataIndex: "batchName", key: "batch", defaultHidden: new Set(applicants.map((a) => a.batchName)).size <= 1, headerFilterKey: "batch" },
    { title: "Class", dataIndex: "className", key: "class", defaultHidden: true },
    { title: "Branch", dataIndex: "branch", key: "branch", headerFilterKey: "branch" },
    { title: "Gender", dataIndex: "gender", key: "gender", defaultHidden: true, headerFilterKey: "gender" },
    // Marks are filters (the panel's Academics) and in every export, not columns: the same as Students.
    ...academicTableColumns({ exportOnly: true }),
    { title: "Stage", dataIndex: "stage", key: "stage", headerFilterKey: "stage", render: (v) => <StatusBadge status={v} label={STAGE_LABEL[v] || v} tone={STAGE_TONE[v] || "neutral"} />, exportValue: (r) => STAGE_LABEL[r.stage] || r.stage },
    // Booked into a round with no result yet reads "scheduled"; otherwise it is the last round that moved them, with its result.
    { title: "Current round", dataIndex: "currentRound", key: "currentRound", headerFilterKey: "round", defaultHidden: !applicants.some((a) => a.currentRound),
      exportValue: (r) => (r.currentRound ? `${r.currentRound}${r.roundState === "SCHEDULED" ? " (scheduled)" : ""}` : ""),
      render: (v, r) => (v ? <span>{v}{r.roundState === "SCHEDULED" && <Typography.Text type="secondary"> · scheduled</Typography.Text>}</span> : <Typography.Text type="secondary">-</Typography.Text>) },
    { title: "Last result", dataIndex: "lastResult", key: "lastResult", headerFilterKey: "lastResult", render: (v) => RESULT_LABEL[v] || v || <Typography.Text type="secondary">—</Typography.Text>, exportValue: (r) => RESULT_LABEL[r.lastResult] || r.lastResult || "" },
    { title: "Skill match", dataIndex: "skillMatch", key: "skillMatch", sorter: (x, y) => (x.skillMatch || 0) - (y.skillMatch || 0), exportValue: (r) => (r.skillMatch == null ? "" : Math.round(Number(r.skillMatch))),
      defaultHidden: !applicants.some((a) => a.skillMatch != null),
      // Out of the skills the drive's form lists ("Skills the company wants"), worked out from the profile when the list loads.
      render: (v, r) => (v == null ? <Typography.Text type="secondary">-</Typography.Text>
        : <Tooltip title={`Lists ${r.skillsMatched} of the ${r.skillsWanted} skills the company wants`}><Tag color={Number(v) >= 70 ? "green" : Number(v) >= 40 ? "gold" : "default"}>{Math.round(Number(v))}%</Tag></Tooltip>) },
    // A plain link when there is a resume; nothing loud when there is not (it was an orange pill on nearly every row). "No resume" is a filter.
    { title: "Resume", key: "readiness", exportValue: (r) => (r.hasResume ? "Resume" : "No resume"),
      render: (_, r) => (r.hasResume && safeHref(r.resumeUrl)
        ? <a href={safeHref(r.resumeUrl)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Open</a>
        : r.hasResume ? "Yes" : <Typography.Text type="secondary">—</Typography.Text>) },
    { title: "Applied on", dataIndex: "appliedAt", key: "appliedAt", defaultHidden: true, render: (v) => (v ? dj(v).format("D MMM, h:mm A") : <Typography.Text type="secondary">—</Typography.Text>),
      sorter: (a, b) => (a.appliedAt ? dj(a.appliedAt).valueOf() : 0) - (b.appliedAt ? dj(b.appliedAt).valueOf() : 0) },
    { title: "Email", dataIndex: "email", key: "email", defaultHidden: true },
    { title: "Phone", dataIndex: "phone", key: "phone", defaultHidden: true },
    ...(requiresCompanyId ? [{ title: "Company ID", dataIndex: "externalRef", key: "externalRef", render: (v) => v || <Typography.Text type="secondary">Missing</Typography.Text> }] : []),
    {
      title: "Flags", key: "flags", headerFilterKey: "flags", defaultHidden: !applicants.some((a) => a.ineligibleFlagAt || a.withdrawalRequested || Number(a.noShows) > 0 || a.withdrawalReason || a.appliedByCollege),
      exportValue: (r) => [(r.withdrawalRequested === true || r.withdrawalRequested === 1) && "Withdrawal requested", r.noShows > 0 && "No-show", r.withdrawalReason === "PLACED_ELSEWHERE" && "Placed elsewhere", r.appliedByCollege && "Added by college"].concat(r.ineligibleFlagAt ? ["Now ineligible"] : []).filter(Boolean).join("; "),
      render: (_, r) => (
        <Space size={4} wrap>
          {r.ineligibleFlagAt && <Tag color="volcano">Now ineligible</Tag>}
          {(r.withdrawalRequested === true || r.withdrawalRequested === 1) && <Tag color="gold"><Link href="/tpo/requests" onClick={(e) => e.stopPropagation()}>Withdrawal requested</Link></Tag>}
          {r.noShows > 0 && <Tag color="red">No-show</Tag>}
          {r.withdrawalReason === "PLACED_ELSEWHERE" && <Tag>Placed elsewhere</Tag>}
          {r.appliedByCollege && <Tag>Added by college</Tag>}
        </Space>
      ),
    },
  ];

  const top = (
    <>
      <JourneyStrip testid="djourney" steps={strip.steps} gaps={strip.gaps} extras={strip.extras} picked={picked} onPick={pick} narrowedBy={narrowedBy}
        caption={`Where the ${plural(applicants.length, "applicant")} of this drive ${applicants.length === 1 ? "is" : "are"} now`} />
      {requiresCompanyId && noCompanyId.length > 0 && (
        <Typography.Paragraph className="tpo-drive-applicants__note" type="warning">
          {plural(noCompanyId.length, "applicant")} haven&apos;t entered their {job.externalPortalName || "company portal"} ID. Pick them in Flags, then Act on them: Send a message.
        </Typography.Paragraph>
      )}
    </>
  );

  return (
    <div className="tpo-drive-applicants">
      {applicants.length === 0 ? (
        <>
          {top}
          <Empty className="tpo-drive-applicants__empty" image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={notApplied.length > 0 ? "No one has applied yet. Click \"not applied\" above to remind them or apply on their behalf." : "No one has applied yet. Applicants show up here as students apply."} />
        </>
      ) : view === "board" ? (
        <>
          {top}
          <div className="tpo-applicant-filters" role="group" aria-label="Applicants view"><span className="tpo-applicant-filters__spacer" />
            <Segmented value={view} onChange={setView} options={[{ value: "table", label: "Table" }, { value: "board", label: "Board" }]} /></div>
          <ApplicantsBoard rows={rows} readOnly={readOnly} onMove={moveOne} onOpenStudent={(r) => onOpenStudent(r.learnerId, rows.findIndex((x) => x.learnerId === r.learnerId))} />
        </>
      ) : (
        <TpoDataTable data={applicants} rowKey="applicationId" columns={columns} exportName={`applicants-${job.companyName}`}
          filterDefs={filterDefs} filterState={filters} onFilterChange={setFilters} filterTitle="Filter applicants"
          viewScope="APPLICANTS" onApplyFilters={(f) => setFilters(legacyApplicantFilters(f))}
          searchOf={(r) => `${fullName(r)} ${r.rollNumber} ${r.branch} ${r.email || ""} ${r.phone || ""} ${r.batchName || ""}`}
          emptyTitle="No applicants yet" emptySubtitle="They'll show up here as students apply to this drive."
          top={top} act={act} counts={() => null}
          toolbar={<Segmented value={view} onChange={setView} options={[{ value: "table", label: "Table" }, { value: "board", label: "Board" }]} />} />
      )}

      <ApplicantReviewModal open={Boolean(review)} rows={review || []} onClose={() => setReview(null)} onShortlist={reviewShortlist} onReject={reviewReject}
        onOpenStudent={(r) => onOpenStudent(r.learnerId, rows.findIndex((x) => x.learnerId === r.learnerId))} />
      <ActionsWindow testid="applicant-actions" open={Boolean(acting)} onClose={() => setActing(null)} audience={acting?.audience || []} selected={Boolean(acting?.selected)}
        noun={APPLICANT} actions={actions} initial={acting?.initial} />
      {bulkElement}

      <AsyncModal open={Boolean(rejecting)} title={`Not selected: ${rejecting ? fullName(rejecting.row) : ""}`} onCancel={() => setRejecting(null)}
        okText="Not selected" okButtonProps={{ danger: true, disabled: !reasonIsValid(reason, REJECT_REASONS) }}
        onOk={async () => { const { row } = rejecting; setRejecting(null); await run("Reject", bulkRejectApplicants(job.id, [row.applicationId], reason.trim()), withUndo(`Not selected: ${fullName(row)}`)); }}>
        <Typography.Paragraph type="secondary">They are told &quot;Not shortlisted&quot;. Your reason below stays inside the placement cell.</Typography.Paragraph>
        <ReasonPicker reasons={REJECT_REASONS} value={reason} onChange={setReason} placeholder="Internal reason" />
      </AsyncModal>

      <Modal open={showNotApplied} title={`Registered, not applied (${notApplied.length})`} footer={null} onCancel={() => setShowNotApplied(false)} width={640}>
        <Typography.Paragraph type="secondary">Students who registered for placements, can apply to this drive and haven&apos;t. Applying on behalf tells the student, who has 48 hours to opt out.</Typography.Paragraph>
        <Space style={{ marginBottom: 12 }}>
          <Button type="primary" disabled={readOnly || notApplied.length === 0} loading={busy}
            onClick={() => Modal.confirm({ title: `Remind ${plural(notApplied.length, "student")} to apply?`, content: `They get an app notification about ${job.companyName}. Students who already applied are not sent anything.`, okText: "Send reminder",
              onOk: () => run("Reminder", remindNotApplied(job.id), () => message.success(`Reminder sent to ${plural(notApplied.length, "student")}`)) })}>
            Remind all {notApplied.length}
          </Button>
        </Space>
        <List size="small" dataSource={notApplied} pagination={{ pageSize: 8 }}
          renderItem={(s) => (
            <List.Item actions={[<Button key="a" size="small" disabled={readOnly} onClick={() => Modal.confirm({
              title: `Apply for ${fullName(s)}?`, content: "They will be told and can opt out for 48 hours.",
              onOk: () => run("Applied", applyOnBehalf(job.id, s.id), () => message.success("Applied on their behalf")),
            })}>Apply on behalf</Button>]}>
              {fullName(s)} · {s.rollNumber} · {s.department}
            </List.Item>
          )} />
      </Modal>
    </div>
  );
}
