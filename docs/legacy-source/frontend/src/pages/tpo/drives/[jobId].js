import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { Alert, Button, Card, DatePicker, Dropdown, List, Modal, Space, Tabs, Tag, Typography, message } from "antd";
import { dj, serverTime } from "@/components/tpo/dj";
import ReasonPicker, { reasonIsValid } from "@/components/tpo/ui/ReasonPicker";
import useRefreshOnFocus from "@/components/tpo/ui/useRefreshOnFocus";
import PageShell from "@/components/Common/PageShell";
import { PanelError, PanelNotFound } from "@/components/Common/PanelStates";
import { DetailSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import ApplicantsTab from "@/components/tpo/drive/ApplicantsTab";
import RoundsTab from "@/components/tpo/drive/RoundsTab";
import OffersTab from "@/components/tpo/drive/OffersTab";
import OverviewTab from "@/components/tpo/drive/OverviewTab";
import ShareModal from "@/components/tpo/drive/ShareModal";
import { buildPublishChecklist } from "@/components/tpo/drive/publishPreflight";
import StudentPanel from "@/components/tpo/StudentPanel";
import { downloadCsv, fullName } from "@/components/tpo/tpoFiles";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import {
  approveDrive, cancelDrive, closeDrive, deleteDraftDrive, extendDeadline, getDrive, getNotApplied, publishDrive, rejectDrive, sendBackDrive,
} from "@/api/Services/TpoService";
import {
  approveAndPublishDrive, cloneDrive, getDriveActivity, getEligibilityPreview, getWorkspaceApplicants, getWorkspaceOffers, getWorkspaceRounds, getWorkspaceSummary,
} from "@/api/Services/TpoHubService";
import AsyncModal from "@/components/tpo/ui/AsyncModal";
import { label } from "@/components/tpo/ui/labels";
import ChangeRequests from "@/components/tpo/drive/ChangeRequests";
import InviteReviewer from "@/components/tpo/drive/InviteReviewer";
import DiscussionTab from "@/components/tpo/drive/DiscussionTab";
import { showRequest } from "@/components/tpo/drive/RequestLine";

const NOT_FOUND = "__not_found__";
const errorText = (res, fallback) => res?.data?.message || res?.data?.error || res?.message || fallback;
// "about" was Overview (its pipeline and numbers became the journey strip on Applicants); old links to it still work.
const TAB_KEYS = ["applicants", "rounds", "offers", "driveday", "discussion", "about"];

const REJECT_REQUEST_REASONS = ["Does not fit our students", "Details are incomplete", "Clashes with another drive", "Company is not approved"];
const SEND_BACK_REASONS = ["Add the CTC details", "Fix the eligibility rules", "Clarify the dates", "Add the interview rounds"];
const CANCEL_REASONS = ["Company withdrew", "Company has a hiring freeze", "Moving it to a new date", "Not enough eligible students"];

/** Drive page (TPO V1 - Locked.docx §5): header with stepper and one main button, then Overview / Applicants / Rounds / Offers / Drive day. */
export default function TpoDrivePage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { jobId } = router.query;
  const askedTab = router.query.tab === "overview" ? "about" : router.query.tab;
  const tabAsked = TAB_KEYS.includes(askedTab) ? askedTab : null;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Which sections failed to load independently of the main Job request - previously any of
  // these failing while the Job request succeeded silently rendered as "0 applicants", "0
  // rounds", etc., indistinguishable from a drive that genuinely has none.
  const [sectionErrors, setSectionErrors] = useState([]);
  const [applicantsRound, setApplicantsRound] = useState(null);
  const [openNotAppliedAt, setOpenNotAppliedAt] = useState(0); // the Next step card opens "registered, not applied" on Applicants // { name, at } from a round card's "Students in this round"
  const [applicants, setApplicants] = useState([]);
  const [notApplied, setNotApplied] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [offers, setOffers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const publishCheckRef = useRef(false);
  const loadSeqRef = useRef(0);
  const [decision, setDecision] = useState(null);
  const [askChange, setAskChange] = useState(false); // "Request a change" from the Next step card (recruiter phase 1, N14)
  const [discussing, setDiscussing] = useState(null); // the request "Discuss" was pressed on: quoted in the Discussion until sent
  const [requestsVersion, setRequestsVersion] = useState(0); // a request settled here: the Discussion shows its line at once
  const [decisionNote, setDecisionNote] = useState("");
  const [publishPreview, setPublishPreview] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [extending, setExtending] = useState(false);
  const [newDeadline, setNewDeadline] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [panel, setPanel] = useState(null); // { list: learnerIds, index }

  useEffect(() => { dispatch(appAction.setActiveMenuItem("drives")); }, [dispatch]);

  // Clear everything the instant jobId changes, so navigating directly from one drive to another
  // never briefly shows the previous drive's data/tabs while the new one loads.
  useEffect(() => { setJob(null); setError(null); setLoading(true); }, [jobId]);

  const load = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    const requestId = ++loadSeqRef.current;
    const [jobRes, appRes, naRes, roundRes, offerRes, sumRes, actRes] = await Promise.all([
      fetchWithErrorHandling(getDrive(jobId)), fetchWithErrorHandling(getWorkspaceApplicants(jobId)), fetchWithErrorHandling(getNotApplied(jobId)),
      fetchWithErrorHandling(getWorkspaceRounds(jobId)), fetchWithErrorHandling(getWorkspaceOffers(jobId)), fetchWithErrorHandling(getWorkspaceSummary(jobId)),
      fetchWithErrorHandling(getDriveActivity(jobId)),
    ]);
    if (requestId !== loadSeqRef.current) return;
    setLoading(false);
    // A drive that doesn't exist (or isn't this college's) is "not found", not "something went wrong" with a Retry that can't help.
    if (!jobRes.success) { setError(jobRes.status === 404 ? NOT_FOUND : errorText(jobRes, "Drive not found")); return; }
    setError(null);
    setJob(jobRes.data);
    const failed = [];
    if (appRes.success) setApplicants(Array.isArray(appRes.data) ? appRes.data : []); else failed.push("Applicants");
    if (naRes.success) setNotApplied(Array.isArray(naRes.data) ? naRes.data : []); else failed.push("Not applied");
    if (roundRes.success) setRounds(Array.isArray(roundRes.data) ? roundRes.data : []); else failed.push("Rounds");
    if (offerRes.success) setOffers(Array.isArray(offerRes.data) ? offerRes.data : []); else failed.push("Offers");
    if (sumRes.success) setSummary(sumRes.data || null); else failed.push("Summary");
    if (actRes.success) setActivity(Array.isArray(actRes.data) ? actRes.data : []); else failed.push("Activity");
    setSectionErrors(failed);
  }, [jobId]);
  useEffect(() => { load(); }, [load]);
  useRefreshOnFocus(load);

  const act = async (label, call) => {
    if (busyRef.current) return null;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await fetchWithErrorHandling(call);
      if (!res.success) { message.error(errorText(res, `${label} failed`)); return null; }
      message.success(label);
      load();
      return res.data;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const setTab = (key) => router.replace({ pathname: router.pathname, query: { ...router.query, tab: key } }, undefined, { shallow: true });
  const openStudent = (learnerId, index) => {
    const list = applicants.map((a) => a.learnerId);
    setPanel({ list, index: index >= 0 ? index : list.indexOf(learnerId) });
  };

  const stagedRound = rounds.find((r) => r.stagedResults > 0);
  const toVerify = offers.filter((o) => ["SELECTED", "PENDING_VERIFICATION"].includes(o.status));
  // Cancel consequence preview (PVN-B009): computed from data already on screen, mirroring the
  // statuses TpoDriveService treats as open.
  const cancelImpact = useMemo(() => ({
    open: applicants.filter((a) => ["APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "WAITLISTED"].includes(a.stage)).length,
    interviewing: applicants.filter((a) => a.stage === "INTERVIEW").length,
    holdingOffers: offers.filter((o) => ["RELEASED", "ACCEPTED"].includes(o.status)).length,
    unreleased: offers.filter((o) => ["SELECTED", "PENDING_VERIFICATION"].includes(o.status)).length,
  }), [applicants, offers]);
  const deadlinePassed = job?.applicationDeadline && dj(job.applicationDeadline).isBefore(dj());
  const mission = useMemo(() => {
    const reachable = applicants.length + notApplied.length;
    const applicationRate = reachable ? Math.round((applicants.length * 100) / reachable) : 0;
    const funnel = Array.isArray(summary?.funnel)
      ? summary.funnel.map((row) => ({ stage: row.stage, count: Number(row.count) || 0 }))
      : [];
    const appliedBase = funnel.find((row) => row.stage === "APPLIED")?.count || applicants.length || 0;
    const stageLabel = { APPLIED: "Applied", SHORTLISTED: "Shortlisted", ASSESSMENT: "Assessment", INTERVIEW: "Interview", OFFERED: "Offered", HIRED: "Hired" };
    const maxStage = Math.max(...funnel.map((row) => row.count), 1);
    const completedRounds = rounds.filter((r) => r.status === "COMPLETED").length;
    const stagedResults = rounds.reduce((sum, r) => sum + (Number(r.stagedResults) || 0), 0);
    // An offer is a released or accepted one, as on the drives list, Home and Reports (selections and withdrawn rows are not offers).
    const offerCount = offers.filter((o) => ["RELEASED", "ACCEPTED"].includes(o.status)).length;
    const attention = [];

    if (job?.recordedOutside && job.lifecycleStatus === "PUBLISHED" && applicants.length === 0) attention.push({
      key: "recorded",
      tone: "attention",
      title: "Add the students who took part", button: "Add students",
      detail: "This drive happened outside the platform. Add them under Applicants (apply on their behalf), then mark round results and offers.",
      action: () => setTab("applicants"),
    });
    if (job?.lifecycleStatus === "PUBLISHED" && !job.applicationDeadline && !job.recordedOutside) attention.push({
      key: "no-deadline",
      tone: "attention",
      title: "No application deadline", button: "Set deadline",
      detail: "Students cannot see when applications close, and the drive never moves on to shortlisting. Set one.",
      action: () => { setNewDeadline(null); setExtending(true); },
    });
    if (notApplied.length > 0 && !job?.recordedOutside) attention.push({
      key: "not-applied",
      tone: "attention",
      title: `${notApplied.length} eligible registered student${notApplied.length === 1 ? " has" : "s have"} not applied`,
      detail: job?.applicationDeadline ? `Remind them or apply on their behalf before ${dj(job.applicationDeadline).format("D MMM, h:mm A")}.` : "Remind them or apply on their behalf.",
      button: "Remind or apply on their behalf",
      action: () => { setTab("applicants"); setOpenNotAppliedAt(Date.now()); },
    });
    if (stagedResults > 0) attention.push({
      key: "results",
      tone: "info",
      title: `${stagedResults} round result${stagedResults === 1 ? " is" : "s are"} waiting to be applied`, button: "Review the results",
      detail: "Students are told only when you review and apply them on the round.",
      action: () => setTab("rounds"),
    });
    if (toVerify.length > 0) attention.push({
      key: "verify",
      tone: "attention",
      title: `${toVerify.length} selection${toVerify.length === 1 ? " needs" : "s need"} verification`, button: "Go to Offers",
      detail: "Verify selections before they become final placement outcomes.",
      action: () => setTab("offers"),
    });
    if (deadlinePassed && applicants.length > 0) attention.push({
      key: "deadline",
      tone: "neutral",
      title: "Application deadline has passed", button: "See the applicants",
      detail: `${applicants.length} applicant${applicants.length === 1 ? " is" : "s are"} ready for the next recruiter hand-off or round.`,
      action: () => setTab("applicants"),
    });

    return {
      reachable,
      applicationRate,
      offerCount,
      completedRounds,
      stagedResults,
      funnel,
      maxStage,
      stageLabel,
      attention: attention.slice(0, 4),
    };
  }, [applicants, notApplied, offers, rounds, summary, toVerify.length, deadlinePassed, job]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Approve and publish" (the REQUEST-path shortcut) used to publish with zero confirmation at
  // all - no eligibility count, no checklist, unlike every other publish path. It now goes through
  // the exact same pre-flight gate.
  const openPublish = async (fromRequest) => {
    if (publishCheckRef.current) return;
    publishCheckRef.current = true;
    setBusy(true);
    try {
      // Publishing depends on both eligibility and the round checklist. Re-read both now instead
      // of trusting potentially partial page state, so a failed source can never become "0 eligible"
      // or "no rounds" inside an irreversible publish confirmation.
      const [eligibilityRes, roundsRes] = await Promise.all([
        fetchWithErrorHandling(getEligibilityPreview(job.id)),
        fetchWithErrorHandling(getWorkspaceRounds(job.id)),
      ]);
      if (!eligibilityRes.success || !eligibilityRes.data || !roundsRes.success || !Array.isArray(roundsRes.data)) {
        message.error("Could not verify eligibility and rounds. Retry before publishing.");
        return;
      }
      setPublishPreview({
        ...eligibilityRes.data,
        checklist: buildPublishChecklist(job, roundsRes.data),
        fromRequest,
      });
    } finally {
      publishCheckRef.current = false;
      setBusy(false);
    }
  };

  // Arriving from the form's "Review and publish" (?publish=1): open the publish check once the drive is in.
  const publishAsked = router.query.publish === "1";
  useEffect(() => {
    if (!publishAsked || !job) return;
    if (["DRAFT", "REQUEST"].includes(job.lifecycleStatus)) openPublish(job.lifecycleStatus === "REQUEST");
    const { publish: _ignored, ...rest } = router.query;
    router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
  }, [publishAsked, job?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !job) return <div className="scroll-container tpo-drive-detail"><PageShell><Card className="tpo-drive-detail__loading"><DetailSkeleton label="Loading drive workspace" withMedia={false} /></Card></PageShell></div>;
  if (error === NOT_FOUND && !job) return <div className="scroll-container tpo-drive-detail"><PageShell><div className="tpo-drive-detail__load-error"><PanelNotFound title="This drive doesn't exist" description="It may have been deleted, or the link is wrong." actionLabel="Go to Drives" onAction={() => router.push("/tpo/drives")} /></div></PageShell></div>;
  if (error && !job) return <div className="scroll-container tpo-drive-detail"><PageShell><div className="tpo-drive-detail__load-error"><PanelError title={error} onRetry={load} /></div></PageShell></div>;
  if (!job) return null;
  // A request or a draft opens on About (there are no applicants yet); a live or closed drive on Applicants.
  const tab = tabAsked || (["REQUEST", "SENT_BACK", "DRAFT", "REJECTED"].includes(job.lifecycleStatus) ? "about" : "applicants");

  const isRequest = job.lifecycleStatus === "REQUEST";
  const isOpen = job.lifecycleStatus === "PUBLISHED";
  const readOnly = false; // seasons are gone: a drive is never read only because of its season
  // Close drive is the main button only once the deadline has passed and nothing else is waiting; otherwise it sits in More.
  const closeIsMain = isOpen && Boolean(job.applicationDeadline) && deadlinePassed && applicants.length === 0 && !stagedRound && toVerify.length === 0;
  const mainButton = (() => {
    if (readOnly) return null;
    if (isRequest) return <Button type="primary" loading={busy} onClick={() => openPublish(true)}>Approve and publish</Button>;
    if (job.lifecycleStatus === "DRAFT") return <Button type="primary" loading={busy} onClick={() => openPublish(false)}>Publish</Button>;
    if (!isOpen) return null;
    if (deadlinePassed && applicants.length > 0) return <Button type="primary" onClick={() => setSharing(true)}>Share {applicants.length} applicants with {job.companyName}</Button>;
    if (stagedRound) return <Button type="primary" onClick={() => setTab("rounds")}>Apply {stagedRound.name} results</Button>;
    if (toVerify.length > 0) return <Button type="primary" onClick={() => setTab("offers")}>Verify {toVerify.length} selections</Button>;
    if (job.recordedOutside) return applicants.length === 0 ? <Button type="primary" onClick={() => setTab("applicants")}>Add students who took part</Button> : null;
    if (!job.applicationDeadline) return <Button type="primary" onClick={() => { setNewDeadline(null); setExtending(true); }}>Set deadline</Button>;
    if (!deadlinePassed) return null;
    // Consequence preview: real counts computed from data already on screen, not generic text -
    // a TPO closing a drive should see exactly how many people this touches before confirming.
    const openApplicants = applicants.filter((a) => !["REJECTED", "WITHDRAWN"].includes(a.stage)).length;
    return <Button danger loading={busy} onClick={() => confirmClose()}>Close drive</Button>;
  })();

  function confirmClose() {
    if (sectionErrors.some((name) => ["Applicants", "Rounds", "Offers"].includes(name))) {
      message.error("Could not verify the people, rounds and offers affected by closing this drive. Retry the missing data first.");
      return;
    }
    // Only students still in play are ended; offered and placed students keep their offer.
    const openApplicants = applicants.filter((a) => ["APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "WAITLISTED"].includes(a.stage)).length;
    if (toVerify.length > 0) {
      // The server refuses too: closing would tell a selected student whose offer is not released yet that they were not selected.
      Modal.warning({ title: "Release the selections first",
        content: `${toVerify.length} selection${toVerify.length === 1 ? " is" : "s are"} not released yet. Release or withdraw ${toVerify.length === 1 ? "it" : "them"} on the Offers tab, then close the drive.` });
      return;
    }
    Modal.confirm({
      title: "Close this drive?",
      content: (
        <Space direction="vertical" size={4}>
          <Typography.Text>{openApplicants} open applicant{openApplicants === 1 ? "" : "s"} become{openApplicants === 1 ? "s" : ""} Not selected.</Typography.Text>
          <Typography.Text>The waitlist ends and any open requests on this drive are approved.</Typography.Text>
          <Typography.Text>All affected students are notified immediately.</Typography.Text>
          <Typography.Text strong type="danger">This cannot be undone.</Typography.Text>
        </Space>
      ),
      okText: "Close drive", okButtonProps: { danger: true }, onOk: () => act("Drive closed", closeDrive(job.id)),
    });
  }

  const frozen = ["CLOSED", "CANCELLED", "REJECTED"].includes(job.lifecycleStatus);
  // A copy is a new draft with the same details, pay, eligibility and rounds; dates are left for the TPO (Create drive's clone).
  const copyDrive = () => Modal.confirm({
    title: "Run this drive again?",
    content: "A new draft is made with its company, role, pay, eligibility and rounds. Dates, applicants and offers are not copied, and nothing is sent to students.",
    okText: "Make a copy",
    onOk: async () => {
      const res = await fetchWithErrorHandling(cloneDrive(job.id));
      if (!res.success) { message.error(res?.data?.message || "Could not copy this drive"); return; }
      const d = res.data || {};
      try {
        window.sessionStorage.setItem(`tpo-drive-cloned:${d.id}`, JSON.stringify({ sourceName: d.sourceName || `${job.companyName} · ${job.jobTitle}`,
          droppedBatches: d.droppedBatches || 0, droppedPassingYears: d.droppedPassingYears || [], wasRecordedOutside: Boolean(d.wasRecordedOutside), wasFromRecruiter: Boolean(d.wasFromRecruiter) }));
      } catch (_) { /* the note is a courtesy */ }
      router.push(`/tpo/drives/${d.id}/edit`);
    },
  });
  // A draft nobody applied to can go (a wrong copy, a drive that will not happen); anything else is cancelled or closed.
  const deleteDraft = () => Modal.confirm({
    title: "Delete this draft?",
    content: "It was never published, so no student has seen it. It is removed from your drives.",
    okText: "Delete draft", okButtonProps: { danger: true },
    onOk: async () => {
      const res = await fetchWithErrorHandling(deleteDraftDrive(job.id));
      if (!res.success) { message.error(res?.data?.message || "Could not delete this draft"); return; }
      message.success("Draft deleted");
      router.push("/tpo/drives");
    },
  });

  const moreMenu = {
    items: [
      // A closed, cancelled or declined drive can't change (its edit page is read only): offer to run it again instead.
      ...(frozen ? [{ key: "again", label: "Run it again (copy)", onClick: copyDrive }] : [{ key: "edit", label: "Edit", onClick: () => router.push(`/tpo/drives/${job.id}/edit`) }]),
      { key: "export", label: "Export applicants", onClick: () => downloadCsv(`applicants-${job.companyName}`, [
        { title: "Name", value: fullName }, { title: "Roll", value: (r) => r.rollNumber }, { title: "Branch", value: (r) => r.branch }, { title: "CGPA", value: (r) => r.cgpa }, { title: "Stage", value: (r) => label("stage", r.stage) },
      ], applicants) },
      { key: "share", label: "Share with company", onClick: () => setSharing(true) },
      ...(isOpen && !closeIsMain ? [{ key: "close", label: "Close drive", onClick: confirmClose }] : []),
      ...(job.lifecycleStatus === "DRAFT" && applicants.length === 0 ? [{ key: "delete", danger: true, label: "Delete draft", onClick: deleteDraft }] : []),
      ...(["DRAFT", "PUBLISHED"].includes(job.lifecycleStatus) ? [{ key: "cancel", danger: true, label: "Cancel drive", onClick: () => { if (sectionErrors.some((name) => ["Applicants", "Rounds", "Offers"].includes(name))) { message.error("Retry the missing Applicants, Rounds and Offers data before cancelling this drive."); return; } setCancelReason(""); setCancelling(true); } }] : []),
    ],
  };

  const todayRounds = rounds.filter((r) => r.mode === "ON_CAMPUS" || !r.mode);

  return (
    <div className="scroll-container tpo-drive-detail" data-testid="tpo.drive">
      <PageShell>
        <ListingPageHeader
          className="tpo-drive-detail__header"
          title={`${job.companyName} · ${job.jobTitle}`}
          subtitle={
            <div className="tpo-drive-detail__meta">
              <Tag className={`tpo-drive-detail__status tpo-drive-detail__status--${String(job.lifecycleStatus || "").toLowerCase()}`}>
                {{ REQUEST: "Needs your review", SENT_BACK: "Sent back", DRAFT: "Draft", PUBLISHED: "Published", CLOSED: "Closed", CANCELLED: "Cancelled", REJECTED: "Declined" }[job.lifecycleStatus] || job.lifecycleStatus}
              </Tag>
              <Typography.Text type="secondary">{{ ON_CAMPUS: "On campus", POOL: "Pool", OFF_CAMPUS: "Off campus" }[job.driveMode] || job.driveMode}</Typography.Text>
              {job.recordedOutside && <Tag className="tpo-drive-detail__recorded">Recorded: happened outside</Tag>}
              {job.ctcRange && <Typography.Text type="secondary">· {job.ctcRange}</Typography.Text>}
              {job.applicationDeadline && <Typography.Text type="secondary">· Deadline {dj(job.applicationDeadline).format("D MMM, h:mm A")}</Typography.Text>}
            </div>
          }
          rightContent={
            <Space wrap className="tpo-drive-detail__header-actions">
              {mainButton}
              <Button onClick={() => setTab("discussion")}>Discussion</Button>
              {!readOnly && isOpen && job.applicationDeadline && <Button onClick={() => { setNewDeadline(dj(job.applicationDeadline)); setExtending(true); }}>Extend deadline</Button>}
              {!readOnly && <Dropdown menu={moreMenu} trigger={["click"]}><Button>More</Button></Dropdown>}
            </Space>
          }
        />

        {/* One Next step card: what needs you now and the button to do it (it replaces the attention list, the number boxes and the
            stepper; the numbers are the journey strip on Applicants). Anything else waiting is listed under it. */}
        {(() => {
          const first = mission.attention[0];
          const rest = mission.attention.slice(1);
          const state = { REQUEST: job.changesMadeAt ? "The company made the changes: review it again" : "Review this recruiter request", SENT_BACK: "Review this recruiter request", DRAFT: "Publish it when it is ready",
            CLOSED: "This drive is completed", CANCELLED: "This drive was cancelled", REJECTED: "You declined this request" }[job.lifecycleStatus];
          const title = isRequest ? state : first?.title || state || (job.applicationDeadline && !deadlinePassed
            ? `Taking applications until ${dj(job.applicationDeadline).format("D MMM, h:mm A")}` : "Nothing needs you right now");
          const detail = isRequest ? "Students can't see it until you approve and publish it." : first?.detail || (job.lifecycleStatus === "PUBLISHED" ? `${applicants.length} applied so far.` : null);
          const tone = ["CLOSED", "CANCELLED", "REJECTED"].includes(job.lifecycleStatus) || (!first && !mainButton && !isRequest) ? "done" : "todo";
          return (
            <section className={`tpo-nextstep is-${tone} tpo-drive-detail__next`} aria-label="Next step" data-testid="drive.next-step">
              <span className="tpo-nextstep__eyebrow">Next step</span>
              <strong className="tpo-nextstep__title">{title}</strong>
              {detail && <Typography.Text type="secondary">{detail}</Typography.Text>}
              <Space wrap>
                {first ? <Button type="primary" onClick={first.action}>{first.button || "Open"}</Button> : mainButton}
                {/* The header's main button is shown here too, unless it is the same action as the card's own (Set deadline). */}
                {first && mainButton && !(first.key === "no-deadline" && !job.applicationDeadline) && mainButton}
                {isRequest && !readOnly && (
                  <>
                    <Button loading={busy} onClick={() => act("Approved. Publish it when you are ready.", approveDrive(job.id))}>Approve for later</Button>
                    <Button onClick={() => setAskChange(true)}>Request a change</Button>
                    <Button danger onClick={() => { setDecisionNote(""); setDecision("reject"); }}>Decline</Button>
                  </>
                )}
              </Space>
              {rest.length > 0 && (
                <div className="tpo-nextstep__also">
                  <Typography.Text type="secondary">Also waiting:</Typography.Text>
                  {rest.map((item) => <Button key={item.key} type="link" size="small" onClick={item.action}>{item.title}</Button>)}
                </div>
              )}
            </section>
          );
        })()}

        {!job.recruiterId && !readOnly && ["DRAFT", "APPROVED", "PUBLISHED"].includes(job.lifecycleStatus) && (
          <div className="tpo-drive-detail__changes">
            <InviteReviewer jobId={job.id} companyName={job.companyName} onDone={load} />
          </div>
        )}
        {job.recruiterId && (
          <div className="tpo-drive-detail__changes">
            <ChangeRequests jobId={job.id} live={job.lifecycleStatus === "PUBLISHED"} openAsk={askChange} onAskClosed={() => setAskChange(false)}
              onChanged={() => { load(); setRequestsVersion((v) => v + 1); }}
              onDiscuss={(r) => { setDiscussing(r); setTab("discussion"); }}
              readOnly={readOnly || ["CLOSED", "CANCELLED", "REJECTED"].includes(job.lifecycleStatus)} />
          </div>
        )}

        {loading && job && <RefreshStatus label="Refreshing drive workspace…" />}
        {error && job && (
          <Alert className="tpo-drive-detail__alert" type="error" showIcon
            message="Couldn't refresh this drive"
            description="Showing the last drive data we loaded."
            action={<Button size="small" onClick={load}>Retry</Button>} />
        )}

        {sectionErrors.length > 0 && (
          <Alert className="tpo-drive-detail__alert" type="error" showIcon closable
            message={`Could not load: ${sectionErrors.join(", ")}`}
            description="Those sections may be showing 0 or be empty even though the real numbers could be different. Retry to check."
            action={<Button size="small" onClick={load}>Retry</Button>} />
        )}

        {job.sentBackNote && ["SENT_BACK", "REQUEST"].includes(job.lifecycleStatus) && <Alert className="tpo-drive-detail__alert" type="info" showIcon message={`Note: ${job.sentBackNote}`} />}

        <Tabs className="tpo-drive-detail__tabs" activeKey={tab} onChange={(key) => setTab(key)} destroyInactiveTabPane
          items={[
            { key: "applicants", label: `Applicants (${applicants.length})`, children: <ApplicantsTab job={job} applicants={applicants} notApplied={notApplied} reload={load} onOpenStudent={openStudent} onShare={() => setSharing(true)} requiresCompanyId={job.requiresExternalRegistration} readOnly={readOnly} showRound={applicantsRound} onGoRounds={() => setTab("rounds")} funnel={summary?.funnel} openNotAppliedAt={openNotAppliedAt} /> },
            { key: "rounds", label: `Rounds (${rounds.length})`, children: <RoundsTab job={job} rounds={rounds} applicants={applicants} reload={load} autoApply={summary?.autoApply} readOnly={readOnly}
              onShowRound={(name) => { setApplicantsRound({ name, at: Date.now() }); setTab("applicants"); }} /> },
            { key: "offers", label: `Offers (${offers.filter((o) => ["RELEASED", "ACCEPTED"].includes(o.status)).length})`, children: <OffersTab job={job} offers={offers} applicants={applicants} reload={load} onOpenStudent={(id) => setPanel({ list: [id], index: 0 })} readOnly={readOnly} /> },
            {
              key: "driveday", label: "Drive day",
              children: (
                <Card className="tpo-drive-detail__drive-day">
                  <div className="tpo-drive-detail__tab-intro">
                    <Typography.Title level={5}>Drive day operations</Typography.Title>
                    <Typography.Paragraph type="secondary">Open a round to take attendance and record results on your phone on the day.</Typography.Paragraph>
                  </div>
                  <List locale={{ emptyText: "Add a round first" }} dataSource={todayRounds} renderItem={(r) => (
                    <List.Item actions={[<Button key="o" type={r.status === "COMPLETED" ? "default" : "primary"} onClick={() => router.push(`/tpo/drive-day/${r.id}`)}>{r.status === "COMPLETED" ? "See attendance" : "Open drive day"}</Button>]}>
                      <List.Item.Meta title={<span>{`${r.seq}. ${r.name}`}{r.status === "COMPLETED" && <Tag color="green" style={{ marginLeft: 8 }}>Done</Tag>}</span>}
                        description={r.status === "COMPLETED" ? "Results applied" : r.scheduledDate ? dj(r.scheduledDate).format("D MMM YYYY, h:mm A") : "Date to be decided"} />
                    </List.Item>
                  )} />
                </Card>
              ),
            },
            { key: "discussion", label: "Discussion", children: <DiscussionTab job={job} readOnly={readOnly} quote={discussing} onQuoteClear={() => setDiscussing(null)} onSeeRequest={showRequest} refreshKey={requestsVersion} /> },
            { key: "about", label: "About this drive", children: <OverviewTab job={job} summary={summary} activity={activity} applicants={applicants} notApplied={notApplied} reload={load} readOnly={readOnly} onNavigateToTab={(key) => setTab(key)} /> },
          ]} />
      </PageShell>

      <AsyncModal open={Boolean(decision)} title="Decline this request" onCancel={() => setDecision(null)} destroyOnClose
        okButtonProps={{ disabled: !reasonIsValid(decisionNote, decision === "reject" ? REJECT_REQUEST_REASONS : SEND_BACK_REASONS), danger: decision === "reject" }} okText="Decline"
        onOk={async () => {
          const note = decisionNote.trim();
          const call = decision === "reject" ? rejectDrive(job.id, note) : sendBackDrive(job.id, note);
          const label = "Request declined. It is now cancelled.";
          // Only close once the server actually confirms - closing first (as this used to) meant a
          // failed request silently discarded the typed reason, forcing the TPO to retype it.
          if (await act(label, call) !== null) setDecision(null);
        }}>
        <Typography.Paragraph type="secondary">The recruiter sees this reason. For anything they can fix, request a change instead: the drive stays in review.</Typography.Paragraph>
        <ReasonPicker reasons={decision === "reject" ? REJECT_REQUEST_REASONS : SEND_BACK_REASONS} value={decisionNote} onChange={setDecisionNote} placeholder="Tell them why" />
      </AsyncModal>

      <AsyncModal open={Boolean(publishPreview)} title="Publish this drive?"
        okText={publishPreview?.fromRequest ? "Approve and publish" : "Publish"}
        okButtonProps={{ disabled: (publishPreview?.checklist?.blocking?.length ?? 0) > 0 }}
        onCancel={() => setPublishPreview(null)}
        onOk={async () => {
          const call = publishPreview?.fromRequest ? approveAndPublishDrive(job.id) : publishDrive(job.id);
          const label = publishPreview?.fromRequest ? "Approved and published" : "Published";
          if (await act(label, call) !== null) setPublishPreview(null);
        }}>
        {publishPreview?.checklist?.blocking?.length > 0 && (
          <Alert type="error" showIcon style={{ marginBottom: 12 }} message="Fix these before publishing"
            description={<ul style={{ margin: 0, paddingLeft: 18 }}>{publishPreview.checklist.blocking.map((b) => <li key={b.key}>{b.label}</li>)}</ul>} />
        )}
        {publishPreview?.checklist?.warnings?.length > 0 && (
          <Alert type="warning" showIcon style={{ marginBottom: 12 }} message="Worth checking"
            description={<ul style={{ margin: 0, paddingLeft: 18 }}>{publishPreview.checklist.warnings.map((w) => <li key={w.key}>{w.label}</li>)}</ul>} />
        )}
        {job.recordedOutside
          ? <Typography.Paragraph>This drive is only being recorded: <b>no student is told</b>. After publishing, add the students who took part and mark their results.</Typography.Paragraph>
          : <Typography.Paragraph><b>{publishPreview?.eligible ?? 0} students</b> are eligible and will be told by App and Email. {publishPreview?.excluded ?? 0} are excluded by the rules.</Typography.Paragraph>}
        <Typography.Paragraph type="secondary">Publishing is not an undo. Students can apply straight away.</Typography.Paragraph>
        <Button onClick={() => { navigator.clipboard?.writeText(`New drive: ${job.companyName} is hiring ${job.jobTitle}${job.ctcRange ? ` (${job.ctcRange})` : ""}. Apply on 42LMS${job.applicationDeadline ? ` before ${dj(job.applicationDeadline).format("D MMM")}` : ""}.`); message.success("Announcement copied"); }}>Copy announcement</Button>
      </AsyncModal>

      {/* "Extend" only ever meant later - the picker previously accepted any date/time, including
          one earlier than the current deadline, silently shortening it instead. */}
      <AsyncModal open={extending} title="Extend the application deadline" onCancel={() => setExtending(false)}
        okButtonProps={{ disabled: !newDeadline || (job.applicationDeadline && !newDeadline.isAfter(dj(job.applicationDeadline))) }}
        onOk={async () => { if (await act("Deadline extended", extendDeadline(job.id, serverTime(newDeadline))) !== null) setExtending(false); }}>
        <Typography.Paragraph type="secondary">Current deadline: {job.applicationDeadline ? dj(job.applicationDeadline).format("D MMM YYYY, h:mm A") : "Not set"}</Typography.Paragraph>
        <DatePicker showTime value={newDeadline} onChange={setNewDeadline} style={{ width: "100%" }} disabledDate={(d) => job.applicationDeadline && d.isBefore(dj(job.applicationDeadline), "day")} />
        {job.applicationDeadline && newDeadline && !newDeadline.isAfter(dj(job.applicationDeadline)) && (
          <Typography.Text type="danger" style={{ display: "block", marginTop: 4 }}>Pick a time after the current deadline.</Typography.Text>
        )}
      </AsyncModal>

      <AsyncModal open={cancelling} title="Cancel this drive?" okText="Cancel drive" okButtonProps={{ danger: true, disabled: !reasonIsValid(cancelReason, CANCEL_REASONS) }} onCancel={() => setCancelling(false)} destroyOnClose
        onOk={async () => { if (await act("Drive cancelled", cancelDrive(job.id, cancelReason.trim())) !== null) setCancelling(false); }}>
        {/* PVN-B009: real consequences, matching what TpoDriveService.cancel now does. */}
        <Space direction="vertical" size={4} style={{ marginBottom: 12 }}>
          <Typography.Text><b>{cancelImpact.open} open applicant{cancelImpact.open === 1 ? "" : "s"}</b> become Not selected and {cancelImpact.open === 1 ? "is" : "are"} told{job.recruiterId ? ", and the recruiter is told too" : ""}.</Typography.Text>
          {cancelImpact.interviewing > 0 && <Typography.Text>{cancelImpact.interviewing} applicant{cancelImpact.interviewing === 1 ? " is" : "s are"} in the interview stage - any scheduled interviews are cancelled and leave the calendar.</Typography.Text>}
          <Typography.Text>Pending withdrawal requests on this drive are approved, and the drive stops counting as a planned drive for the company.</Typography.Text>
          {cancelImpact.unreleased > 0 && <Typography.Text>{cancelImpact.unreleased} selection{cancelImpact.unreleased === 1 ? "" : "s"} not released yet {cancelImpact.unreleased === 1 ? "is" : "are"} withdrawn (the student{cancelImpact.unreleased === 1 ? " was" : "s were"} never told).</Typography.Text>}
          {cancelImpact.holdingOffers > 0 && <Typography.Text type="warning">{cancelImpact.holdingOffers} released or accepted offer{cancelImpact.holdingOffers === 1 ? "" : "s"} stay as they are - withdraw them from the Offers tab if the company is pulling them.</Typography.Text>}
          <Typography.Text strong type="danger">This cannot be undone.</Typography.Text>
        </Space>
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>Students see the reason.</Typography.Text>
        <ReasonPicker reasons={CANCEL_REASONS} value={cancelReason} onChange={setCancelReason} placeholder="Reason students will see" />
      </AsyncModal>

      <ShareModal open={sharing} job={job} applicantCount={applicants.length} onClose={() => setSharing(false)} />
      {panel && (
        <StudentPanel learnerId={panel.list[panel.index]} jobId={job.id} onClose={() => setPanel(null)} onChanged={load}
          onPrev={panel.index > 0 ? () => setPanel({ ...panel, index: panel.index - 1 }) : null}
          onNext={panel.index < panel.list.length - 1 ? () => setPanel({ ...panel, index: panel.index + 1 }) : null} />
      )}
    </div>
  );
}
