import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Router, { useRouter } from "next/router";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { Alert, Button, Card, Collapse, DatePicker, Drawer, Empty, Form, Input, InputNumber, List, Modal, Rate, Result, Select, Skeleton, Space, Table, Tabs, Tag, Typography, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import moment from "moment";
import { momentFromApi } from "@/utils/placementDateTime";
import PageShell from "@/components/Common/PageShell";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { appAction } from "@/redux/store";
import { dj, serverTime } from "@/components/tpo/dj";
import { downloadCsv } from "@/components/tpo/tpoFiles";
import {
  addDriveRound, deleteDriveRound, updateDriveRound, downloadDriveResumesZip, getDriveApplicants, getDrivePipeline, getRecruiterMe, getHrThread, getRecruiterMessagesPulse, listDriveNotes, listDriveOffers, listDriveRequests, listDriveRounds, listHrThreads, listMyDrives, listRoundSlots, proposeRoundSlots,
  saveDriveNote, sendRecruiterMessage, submitRoundResults, submitSelectionList,
} from "@/api/Services/RecruiterService";
import useRefreshOnFocus from "@/components/tpo/ui/useRefreshOnFocus";
import useLivePulse from "@/components/tpo/ui/useLivePulse";
import RecruiterDriveOverview from "@/components/recruiter/RecruiterDriveOverview";
import RecruiterFocusedReview from "@/components/recruiter/RecruiterFocusedReview";
import { ACCESS_ENDED_TEXT, accessEnded, driveStatus } from "@/components/recruiter/recruiterRoutes";
import { getSafeInternalReturnPath } from "@/utils/navigationContext";
import RecruiterChangeRequests from "@/components/recruiter/RecruiterChangeRequests";
import NoCollegeSession from "@/components/recruiter/NoCollegeSession";
import { StatusBadge } from "@/components/Common/PanelStates";
import { RequestEventLine, RequestQuote, showRequest } from "@/components/tpo/drive/RequestLine";
import { STAGE_LABEL, applicantName, columnLabel, factsOf, safeHref } from "@/components/recruiter/recruiterReviewUtils";

const errorText = (e, fallback) => e?.response?.data?.error || e?.response?.data?.message || fallback;
const OUTCOMES = [{ value: "PASS", label: "Pass / shortlisted" }, { value: "FAIL", label: "Not selected" }, { value: "HOLD", label: "Waitlist" }, { value: "ABSENT", label: "Absent" }];
const label = (a) => a.name || [a.firstName, a.lastName].filter(Boolean).join(" ") || a.applicantId;
// Requests and Discussion were two tabs for one conversation with the placement cell: one Discussion tab now, the requests on top
// (UX audit, 19 Oct 2026). Old ?tab=requests links land there.
const TABS = ["overview", "applicants", "rounds", "offers", "messages"];
const OFFER_STATUS = {
  SELECTED: ["With the placement cell", "gold"], PENDING_VERIFICATION: ["Being verified", "gold"], RELEASED: ["Awaiting reply", "blue"], ACCEPTED: ["Accepted", "green"],
  DECLINED: ["Declined", "red"], EXPIRED: ["Expired", "default"], WITHDRAWN: ["Withdrawn", "default"], REVOKED: ["Withdrawn", "default"],
};
const JOINING = { JOINED: "Joined", DEFERRED: "Deferred", NOT_JOINED: "Did not join" };

/**
 * One drive, everything about it in one place: Overview (where it is and what is next), Applicants (review them one by one),
 * Rounds (interviews and results), Offers and Messages. A recruiter only ever reaches their own drive at their own college.
 */
export default function RecruiterDrivePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const jobId = typeof router.query.jobId === "string" ? router.query.jobId : null;
  const [collegeId, setCollegeId] = useState(null);
  const [ownerId, setOwnerId] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [drive, setDrive] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [applicants, setApplicants] = useState({ shared: false, applicants: [], columns: [] });
  const [state, setState] = useState("loading");
  const [pipeline, setPipeline] = useState(null);
  const [pipelineError, setPipelineError] = useState(null);
  const [notes, setNotes] = useState({});
  const [notesError, setNotesError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [details, setDetails] = useState(null); // the drive as students see it: type, pay, place, who can apply
  const [reviewing, setReviewing] = useState(false);
  const rawTab = typeof router.query.tab === "string" ? router.query.tab : "overview";
  const requestedTab = { interviews: "rounds", interview: "rounds", results: "rounds", selections: "offers", requests: "messages" }[rawTab] || rawTab;
  const tab = TABS.includes(requestedTab) ? requestedTab : "overview";

  useEffect(() => { dispatch(appAction.setActiveMenuItem("drives")); }, [dispatch]);

  // Back returns to the list the recruiter came from (its tab and search), kept across tab changes here.
  const returnTo = getSafeInternalReturnPath(router.query.returnTo, { fallback: "", allowedPrefixes: ["/recruiter/drives"] });
  const setTab = useCallback((next) => { router.replace({ pathname: router.pathname, query: { jobId, tab: next, ...(returnTo ? { returnTo } : {}) } }, undefined, { shallow: true }); }, [router, jobId, returnTo]);
  const [discussing, setDiscussing] = useState(null); // the request "Discuss" was pressed on: quoted in the Discussion until sent
  const [requestsVersion, setRequestsVersion] = useState(0); // a request settled here: the Discussion shows its line at once
  // "See the request" from the Discussion: the Requests tab, then the request itself.
  const seeRequest = useCallback((id) => { setTab("messages"); setTimeout(() => showRequest(id), 350); }, [setTab]);

  // BE-0141: the screen belongs to the newest load of the drive in the address. Each load has a number and a late answer
  // (from the drive you just left, or an older refresh) is dropped; moving to another drive clears the old drive's data.
  const loadSeq = useRef(0);
  const jobIdRef = useRef(jobId);
  jobIdRef.current = jobId;
  useEffect(() => {
    loadSeq.current += 1;
    setDrive(null);
    setRounds([]);
    setApplicants({ shared: false, applicants: [], columns: [] });
    setPipeline(null);
    setPipelineError(null);
    setNotes({});
    setNotesError(null);
    setRefreshError(null);
    setReviewing(false);
  }, [jobId]);

  // A failed load and "this drive genuinely does not exist" are not the same: the first is retryable.
  const load = useCallback(async (college, quiet = false) => {
    const seq = ++loadSeq.current;
    const stale = () => seq !== loadSeq.current || jobIdRef.current !== jobId;
    if (!quiet) setState("loading");
    if (!quiet) setRefreshError(null);
    try {
      // Whether the drive is this recruiter's comes first: rounds and applicants of a drive that isn't (or doesn't exist) are
      // refused, and that used to show "We couldn't load this drive" with a Retry that could never work (night audit).
      const drives = await listMyDrives(college);
      if (stale()) return;
      const d = (drives?.data || []).find((x) => String(x.id) === String(jobId));
      if (!d) { setState("missing"); return; }
      const [r, a] = await Promise.all([listDriveRounds(college, jobId), getDriveApplicants(college, jobId)]);
      if (stale()) return;
      setDrive(d);
      setRounds(Array.isArray(r?.data) ? r.data : []);
      setApplicants(a?.data || { shared: false, applicants: [], columns: [] });
      setState("ready");
      setRefreshError(null);

      const [pipelineResult, notesResult, detailsResult] = await Promise.allSettled([
        getDrivePipeline(college, jobId),
        listDriveNotes(college, jobId),
        // Extra detail for the Overview; a failure here never fails the drive.
        Promise.resolve().then(() => listDriveRequests(college)),
      ]);
      if (stale()) return;
      if (detailsResult.status === "fulfilled" && Array.isArray(detailsResult.value?.data)) {
        setDetails(detailsResult.value.data.find((x) => String(x.id) === String(jobId)) || null);
      }

      if (pipelineResult.status === "fulfilled") {
        setPipeline(Array.isArray(pipelineResult.value?.data) ? pipelineResult.value.data : null);
        setPipelineError(null);
      } else {
        // Preserve the last successful funnel instead of turning a refresh failure into "no funnel".
        setPipelineError(errorText(pipelineResult.reason, "Could not load the drive pipeline"));
      }

      if (notesResult.status === "fulfilled") {
        const rows = Array.isArray(notesResult.value?.data) ? notesResult.value.data : [];
        setNotes(Object.fromEntries(rows.map((x) => [x.applicantId, { rating: x.rating, note: x.note }])));
        setNotesError(null);
      } else {
        // Existing private notes must never fail into an empty map: an empty note is an editable
        // business state and could cause a recruiter to overwrite a note they simply could not load.
        setNotesError(errorText(notesResult.reason, "Could not load your private applicant notes"));
      }
    } catch (error) {
      if (stale()) return;
      if (quiet) {
        setRefreshError(errorText(error, "This drive could not be refreshed. Showing the last successful load."));
        setState((s) => (s === "loading" ? "error" : s)); // it may have replaced a first load that is now dropped
      } else {
        setState(accessEnded(error) ? "ended" : "error");
      }
    }
  }, [jobId]);
  useRefreshOnFocus(() => { if (collegeId) load(collegeId, true); });

  // Saved on the server; the screen keeps showing what was just typed even if a save has to be retried.
  const updateNote = useCallback(async (applicantId, rating, note) => {
    if (notesError) throw new Error("Private notes are unavailable. Retry the drive before editing them.");
    await saveDriveNote(collegeId, jobId, applicantId, rating, note);
    setNotes((prev) => {
      const next = { ...prev };
      if (rating == null && !String(note || "").trim()) delete next[applicantId]; else next[applicantId] = { rating, note: String(note || "").trim() || null };
      return next;
    });
  }, [collegeId, jobId, notesError]);

  const start = useCallback(() => {
    if (!jobId) return;
    setState("loading");
    getRecruiterMe().then((res) => {
      if (jobIdRef.current !== jobId) return; // the address moved on while this was asked
      const me = res?.data;
      if (me?.scope !== "COLLEGE" || !me.collegeId) { setState("scope"); return; }
      setCollegeId(me.collegeId);
      setCompanyName(me.user?.companyName || "");
      setOwnerId(me.user?.id ?? null);
      load(me.collegeId);
    }).catch(() => { if (jobIdRef.current === jobId) setState("error"); });
  }, [jobId, load]);

  useEffect(() => { start(); }, [start]);

  // Arriving from Today's "Review now" opens the review straight away.
  useEffect(() => {
    if (state === "ready" && router.query.review === "1" && applicants.shared && rounds.length) setReviewing(true);
  }, [state, router.query.review, applicants.shared, rounds.length]);

  const back = <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => router.push(returnTo || "/recruiter/drives")}>Back to Drives</Button>;
  const stateCard = (node) => <div className="scroll-container recruiter-drive-detail recruiter-drive-detail--state"><PageShell><Card className="recruiter-drive-detail__state-card">{node}</Card></PageShell></div>;
  if (state === "loading") return stateCard(<Skeleton active paragraph={{ rows: 6 }} />);
  if (state === "error") return stateCard(<Result status="warning" title="We couldn't load this drive" extra={[<Button key="r" type="primary" onClick={() => (collegeId ? load(collegeId) : start())}>Retry</Button>, back]} />);
  if (state === "scope") return stateCard(<NoCollegeSession />);
  if (state === "ended") return stateCard(<Result status="info" title="No access to this college" subTitle={ACCESS_ENDED_TEXT} />);
  if (state === "missing") return stateCard(<Result status="404" title="We could not find this drive" subTitle="It isn't one of your drives at this college, or it was removed." extra={back} />);

  const status = driveStatus(drive.lifecycle);
  const onAction = (kind) => {
    if (kind === "requests" || kind === "fix") setTab("messages");
    else if (kind === "again") router.push(`/recruiter/drives/new?from=${jobId}`);
    else if (kind === "edit") router.push(`/recruiter/drives/new?edit=${jobId}`);
    else if (kind === "review") { setTab("applicants"); if (rounds.length) setReviewing(true); else message.info("The placement cell has not set up a round yet."); }
    else if (kind === "slots") setTab("rounds");
  };

  return (
    <div className="scroll-container recruiter-drive-detail" data-testid="recruiter.drive">
      <PageShell>
        {(refreshError || pipelineError || notesError) && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="Some drive information may be stale or unavailable"
            description={[
              refreshError ? "drive refresh" : null,
              pipelineError ? "pipeline metrics" : null,
              notesError ? "private applicant notes" : null,
            ].filter(Boolean).join(", ") + ". Last-known information is kept where available; private-note editing is disabled until notes reload."}
            action={<Button size="small" onClick={() => load(collegeId)}>Retry drive</Button>}
          />
        )}
        <ListingPageHeader
          className="recruiter-drive-detail__header"
          // The badge matches the Drives list; the line under the title says what the drive is, not its counts (those are on the
          // tabs), and Back is a small link so a phone shows the drive, not the header (UX audit, 19 Oct 2026).
          title={<Space wrap>{drive.roleTitle}<StatusBadge status={status.status} label={status.label} /></Space>}
          subtitle={<Typography.Text type="secondary">{[drive.jobType, drive.ctc, drive.location, drive.mode === "OFF_CAMPUS" ? "Off campus" : drive.mode === "POOL" ? "Pool drive" : "On campus", drive.deadline && drive.lifecycle === "PUBLISHED" ? `Applications close ${momentFromApi(drive.deadline).format("D MMM, h:mm A")}` : null].filter(Boolean).join(" · ")}</Typography.Text>}
          rightContent={<Button type="link" icon={<ArrowLeftOutlined />} onClick={() => router.push(returnTo || "/recruiter/drives")}>All drives</Button>}
        />

        <Card className="recruiter-drive-detail__workspace">
          <Tabs
            className="recruiter-drive-detail__tabs"
            activeKey={tab}
            onChange={setTab}
            items={[
              { key: "overview", label: "Overview", children: <RecruiterDriveOverview drive={drive} details={details} rounds={rounds} applicantCount={applicants.applicants.length} pipeline={pipeline} companyName={companyName} onAction={onAction} /> },
              { key: "applicants", label: `Applicants (${applicants.applicants.length})`, children: <ApplicantsPanel data={applicants} live={["PUBLISHED", "CLOSED"].includes(drive.lifecycle)} jobTitle={drive.roleTitle} collegeId={collegeId} jobId={jobId} rounds={rounds} notes={notes} notesAvailable={!notesError} onReview={() => setReviewing(true)} /> },
              { key: "rounds", label: "Rounds & interviews", children: <RoundsPanel collegeId={collegeId} jobId={jobId} rounds={rounds} applicants={applicants.applicants} finished={driveStatus(drive.lifecycle).group === "closed"} onSent={() => load(collegeId)} /> },
              { key: "offers", label: `Offers${drive.offers ? ` (${drive.offers})` : ""}`, children: <OffersPanel collegeId={collegeId} jobId={jobId} applicants={applicants.applicants} finished={driveStatus(drive.lifecycle).group === "closed"} /> },
              { key: "messages", label: `Discussion${drive.openRequests ? ` (${drive.openRequests} to answer)` : ""}`, children: (
                <div className="recruiter-drive-detail__discussion">
                  <RecruiterChangeRequests collegeId={collegeId} jobId={Number(jobId)} readOnly={status.group === "closed"} live={drive.lifecycle === "PUBLISHED"}
                    onChanged={() => { load(collegeId); setRequestsVersion((v) => v + 1); }} onDiscuss={(r) => { setDiscussing(r); setTab("messages"); }} />
                  <MessagesTab collegeId={collegeId} jobId={Number(jobId)} quote={discussing} onQuoteClear={() => setDiscussing(null)}
                    onSeeRequest={seeRequest} refreshKey={requestsVersion} />
                </div>
              ) },
            ]}
          />
        </Card>
      </PageShell>
      {reviewing && (
        <ReviewLauncher
          rounds={rounds}
          applicants={applicants.applicants}
          collegeId={collegeId}
          jobId={jobId}
          owner={ownerId}
          notes={notes}
          notesAvailable={!notesError}
          onNote={updateNote}
          onClose={() => { setReviewing(false); if (router.query.review) router.replace({ pathname: router.pathname, query: { jobId, tab: "applicants" } }, undefined, { shallow: true }); }}
          onSent={() => load(collegeId)}
        />
      )}
    </div>
  );
}

/** Picks the round the decisions are for (the first one still open), then runs the review. */
function ReviewLauncher({ rounds, applicants, collegeId, jobId, owner, notes, notesAvailable, onNote, onClose, onSent }) {
  const open = rounds.filter((r) => r.status !== "COMPLETED");
  const [round, setRound] = useState(open.length === 1 || rounds.length === 1 ? (open[0] || rounds[0]) : null);
  if (!round) {
    return (
      <Modal open title="Which round are these decisions for?" onCancel={onClose} footer={null} destroyOnClose>
        <List dataSource={open.length ? open : rounds} renderItem={(r) => (
          <List.Item actions={[<Button key="s" type="primary" onClick={() => setRound(r)}>Review for this round</Button>]}>
            <List.Item.Meta title={`${r.seq}. ${r.name}`} description={r.scheduledDate ? dj(r.scheduledDate).format("D MMM, h:mm A") : "Date to be decided"} />
          </List.Item>
        )} />
      </Modal>
    );
  }
  return <RecruiterFocusedReview applicants={applicants} collegeId={collegeId} jobId={jobId} round={round} owner={owner} notes={notes} notesAvailable={notesAvailable} onNote={onNote} onClose={onClose} onSent={onSent} />;
}

/** The shared applicants as a table, with a stage filter, a detail drawer, and the entrance to the focused review. */
function ApplicantsPanel({ data, live = true, jobTitle, collegeId, jobId, rounds, notes = {}, notesAvailable = true, onReview }) {
  const [stage, setStage] = useState("all");
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState("");
  const stages = useMemo(() => Array.from(new Set(data.applicants.map((a) => a.stage).filter(Boolean))), [data.applicants]);
  const needle = q.trim().toLowerCase();
  const shown = (stage === "all" ? data.applicants : data.applicants.filter((a) => a.stage === stage))
    .filter((a) => !needle || [applicantName(a), a.roll, a.email].some((v) => String(v || "").toLowerCase().includes(needle)));
  if (!live && !data.applicants.length) return <Alert type="info" showIcon message="Students apply once the drive is live" description="The placement cell publishes it to students. Applicants show up here after that." />;
  if (!data.shared) return <Alert type="info" showIcon message="The placement cell has not shared the applicants yet" description="When they share the list, it appears here with the same details a link would show, and you can review everyone one by one." />;
  return (
    <Space direction="vertical" className="recruiter-drive-detail__tab-stack">
      <Card size="small" className="recruiter-review-cta" data-testid="recruiter.applicants.cta">
        <div>
          <Typography.Text strong>{data.applicants.length} applicant{data.applicants.length === 1 ? "" : "s"} {data.direct ? "so far" : "shared with you"}</Typography.Text>
          {data.direct && <div><Typography.Text type="secondary">This college shows you applicants as they apply. Contact details come once the placement cell shares them.</Typography.Text></div>}
          <div><Typography.Text type="secondary">Open each applicant in turn and choose Shortlist, Waitlist or Reject. The placement cell applies your decisions.</Typography.Text></div>
        </div>
        <Button type="primary" disabled={!rounds.length || !data.applicants.length} onClick={onReview} data-testid="recruiter.applicants.start">Review one by one</Button>
        {!notesAvailable && <Typography.Text type="warning">Private ratings/notes are temporarily unavailable; review decisions still work.</Typography.Text>}
      </Card>
      {!rounds.length && <Alert type="info" showIcon message="Reviewing needs a round" description="The placement cell has not set up a round for this drive yet." />}
      <div className="recruiter-applicants__filters">
        {stages.length > 1 && (
          <Space wrap>
            <Button size="small" type={stage === "all" ? "primary" : "default"} onClick={() => setStage("all")}>All ({data.applicants.length})</Button>
            {stages.map((s) => <Button key={s} size="small" type={stage === s ? "primary" : "default"} onClick={() => setStage(s)}>{STAGE_LABEL[String(s).toUpperCase()] || s} ({data.applicants.filter((a) => a.stage === s).length})</Button>)}
          </Space>
        )}
        {data.applicants.length > 8 && <Input.Search allowClear className="recruiter-applicants__search" placeholder="Search by name or roll number" value={q} onChange={(e) => setQ(e.target.value)} />}
      </div>
      <ApplicantsTab data={{ ...data, applicants: shown }} jobTitle={jobTitle} collegeId={collegeId} jobId={jobId} notes={notes} onOpen={setSelected} />
      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} width={420} title={selected ? applicantName(selected) : ""}>
        {selected && (
          <>
            <dl className="recruiter-review__facts">{factsOf(selected).map((f) => <div key={f.key}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>
            {notes[selected.applicantId] && (
              <div className="recruiter-review__note" data-testid="recruiter.drawer.note">
                <Typography.Text strong>Your private note</Typography.Text>
                {notes[selected.applicantId].rating ? <div><Rate disabled value={notes[selected.applicantId].rating} /></div> : null}
                {notes[selected.applicantId].note ? <Typography.Paragraph>{notes[selected.applicantId].note}</Typography.Paragraph> : null}
              </div>
            )}
            <Space direction="vertical">
              {safeHref(selected.resume) && <a href={safeHref(selected.resume)} target="_blank" rel="noopener noreferrer">Open resume</a>}
              {safeHref(selected.github) && <a href={safeHref(selected.github)} target="_blank" rel="noopener noreferrer">GitHub</a>}
              {safeHref(selected.portfolio) && <a href={safeHref(selected.portfolio)} target="_blank" rel="noopener noreferrer">Portfolio</a>}
            </Space>
          </>
        )}
      </Drawer>
    </Space>
  );
}

/** Rounds in order: when and where, what is waiting on the placement cell, then slots and results for the chosen round. */
// "Test", not "Online test": a test can be in a hall on campus (UX audit, 19 Oct 2026).
export const ROUND_KINDS = [
  { value: "TALK", label: "Company talk" }, { value: "TEST", label: "Test" }, { value: "VENDOR_TEST", label: "Vendor test" },
  { value: "GD", label: "Group discussion" }, { value: "INTERVIEW", label: "Interview" },
];

/**
 * A round's state from what is true about it: a date or booked students make it scheduled. It read "Not scheduled" while it had
 * a date, a venue and 15 students booked, because the round's own status only changes when results come in (UX audit, 19 Oct 2026).
 */
export function roundState(r) {
  if (r.status === "COMPLETED") return { label: "Completed", color: "green" };
  if (Number(r.booked) > 0 || r.scheduledDate || r.status === "SCHEDULED") return { label: "Scheduled", color: "blue" };
  return { label: "Date to be set", color: "default" };
}

/** What is happening in a round, in words: "15 students booked · 4 interview slots · 3 results waiting for the placement cell". */
export function roundFacts(r) {
  const n = (v) => Number(v) || 0;
  const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`;
  return [
    n(r.booked) ? plural(n(r.booked), "student booked", "students booked") : null,
    n(r.slotsTotal) ? plural(n(r.slotsTotal), "interview slot", "interview slots") : null,
    n(r.slotsProposed) > n(r.slotsConfirmed) ? `${n(r.slotsProposed) - n(r.slotsConfirmed)} of your slots waiting for the placement cell` : null,
    n(r.resultsWaiting) ? `${plural(n(r.resultsWaiting), "result", "results")} waiting for the placement cell` : null,
    n(r.resultsApplied) ? `${plural(n(r.resultsApplied), "result", "results")} applied` : null,
  ].filter(Boolean).join(" · ");
}

/** Add a round at the end, or rename one you added. Dates and venues stay with the placement cell. */
function RoundModal({ open, round, collegeId, jobId, onClose, onSaved }) {
  const [form] = Form.useForm();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (open) {
      form.setFieldsValue(round ? { kind: round.kind, name: round.name, mode: round.mode || undefined } : { kind: "INTERVIEW", name: "", mode: undefined });
      setDirty(false);
    }
  }, [open, round, form]);
  const requestClose = () => {
    if (busyRef.current) return;
    if (!dirty) {
      onClose();
      return;
    }
    Modal.confirm({
      title: "Discard these round changes?",
      content: "Your unsaved round details will be lost.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: onClose,
    });
  };
  const save = async () => {
    if (busyRef.current) return;
    const v = await form.validateFields().catch(() => null);
    if (!v) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const body = { kind: v.kind, name: v.name.trim(), mode: v.mode || null };
      if (round) await updateDriveRound(collegeId, jobId, round.id, body); else await addDriveRound(collegeId, jobId, body);
      message.success(round ? "Round updated" : "Round added. The placement cell will set its date.");
      setDirty(false);
      onSaved();
    } catch (e) { message.error(errorText(e, "Could not save the round")); }
    busyRef.current = false;
    setBusy(false);
  };
  return (
    <Modal open={open} title={round ? "Change this round" : "Add a round at the end"} okText={round ? "Save" : "Add round"} confirmLoading={busy} onOk={save} onCancel={requestClose}
      maskClosable={!busy} closable={!busy} keyboard={!busy} cancelButtonProps={{ disabled: busy }} destroyOnClose>
      <Form form={form} layout="vertical" onValuesChange={() => setDirty(true)}>
        <Form.Item name="kind" label="Type" rules={[{ required: true, message: "Choose a type" }]}><Select options={ROUND_KINDS} /></Form.Item>
        <Form.Item name="name" label="Name" rules={[{ required: true, whitespace: true, message: "Give the round a name" }]}><Input maxLength={100} placeholder="For example: Managerial round" /></Form.Item>
        <Form.Item name="mode" label="Where"><Select allowClear placeholder="Decide later" options={[{ value: "ON_CAMPUS", label: "On campus" }, { value: "VIRTUAL", label: "Online" }]} /></Form.Item>
        <Typography.Text type="secondary">The placement cell sets the date and venue, and tells students when it is ready.</Typography.Text>
      </Form>
    </Modal>
  );
}

/** Rounds in order: when and where, what is waiting on the placement cell, then slots and results for the chosen round. */
function RoundsPanel({ collegeId, jobId, rounds, applicants, finished, onSent }) {
  const [editing, setEditing] = useState(null); // null closed, {} new, round existing
  const [deletingRoundId, setDeletingRoundId] = useState(null);
  const deletingRef = useRef(false);
  const remove = (r) => Modal.confirm({
    title: `Remove "${r.name}"?`, content: "Only rounds without results or students can be removed.", okText: "Remove", okButtonProps: { danger: true },
    onOk: async () => {
      if (deletingRef.current) return;
      deletingRef.current = true;
      setDeletingRoundId(r.id);
      try {
        await deleteDriveRound(collegeId, jobId, r.id);
        message.success("Round removed");
        onSent();
      } catch (e) {
        message.error(errorText(e, "Could not remove the round"));
      } finally {
        deletingRef.current = false;
        setDeletingRoundId(null);
      }
    },
  });
  const add = !finished && <Button onClick={() => setEditing({})} data-testid="recruiter.rounds.add">Add a round</Button>;
  const modal = <RoundModal open={Boolean(editing)} round={editing && editing.id ? editing : null} collegeId={collegeId} jobId={jobId} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onSent(); }} />;
  if (!rounds.length) return <div>{modal}<Empty description="No rounds yet. Add the first one, or the placement cell will.">{add}</Empty></div>;
  return (
    <Space direction="vertical" className="recruiter-drive-detail__tab-stack">
      {modal}
      {add}
      <List className="recruiter-rounds" size="small" dataSource={rounds} renderItem={(r) => (
        <List.Item data-testid={`recruiter.round-${r.id}`} actions={Number(r.mine) === 1 && !Number(r.inUse) && !finished ? [<Button key="e" type="link" size="small" onClick={() => setEditing(r)}>Change</Button>, <Button key="d" type="link" size="small" danger loading={deletingRoundId === r.id} disabled={deletingRoundId != null && deletingRoundId !== r.id} onClick={() => remove(r)}>Remove</Button>] : undefined}>
          <List.Item.Meta
            title={<span>{r.seq}. {r.name} <Tag>{(ROUND_KINDS.find((k) => k.value === r.kind) || {}).label || r.kind}</Tag>{(() => { const s = roundState(r); return <Tag color={s.color}>{s.label}</Tag>; })()}{Number(r.addedByRecruiter) === 1 && <Tag color="purple">Added by you</Tag>}</span>}
            description={[r.scheduledDate ? dj(r.scheduledDate).format("ddd D MMM, h:mm A") : "Date to be set by the placement cell", r.mode === "VIRTUAL" ? "Online" : r.venue].filter(Boolean).join(" · ")}
          />
          <Typography.Text type="secondary">{roundFacts(r) || "No students booked yet"}</Typography.Text>
        </List.Item>
      )} />
      {/* A finished drive takes no new slots or results (BE-0139; the server refuses them too). */}
      {finished
        ? <Alert type="info" showIcon message="This drive is finished, so slots and results can no longer be sent." />
        : <Collapse ghost items={[
          { key: "slots", label: "Propose interview times", children: <SlotsTab collegeId={collegeId} jobId={jobId} rounds={rounds} /> },
          { key: "results", label: "Send a round's results (who passed, who did not)", children: <ResultsTab collegeId={collegeId} jobId={jobId} rounds={rounds} applicants={applicants} onSent={onSent} /> },
        ]} />}
    </Space>
  );
}

/** Offers on this drive in the recruiter's words, then the form to send a new selection list. */
function OffersPanel({ collegeId, jobId, applicants, finished }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(() => {
    setError(null);
    listDriveOffers(collegeId, jobId).then((r) => { if (!Array.isArray(r?.data)) throw new Error("Invalid offers response"); setRows(r.data); }).catch((e) => setError(errorText(e, "Could not load the offers")));
  }, [collegeId, jobId]);
  useEffect(() => { load(); }, [load]);
  return (
    <Space direction="vertical" className="recruiter-drive-detail__tab-stack">
      {error ? <Alert type="warning" showIcon message={error} action={<Button size="small" onClick={load}>Retry</Button>} />
        : rows === null ? <Skeleton active paragraph={{ rows: 3 }} />
        : (
          <Table size="small" rowKey="id" dataSource={rows} pagination={{ pageSize: 15, hideOnSinglePage: true }} locale={{ emptyText: "No offers yet. When you know who you want to hire, send your selection list below; the placement cell checks it and releases the offers." }}
            columns={[
              { title: "Candidate", key: "n", render: (_, o) => <span>{o.name || o.applicantId} <Typography.Text type="secondary">{o.roll}</Typography.Text></span> },
              { title: "Type", dataIndex: "kind", key: "k", render: (k) => (k === "LOI" ? "Letter of intent" : "Offer") },
              { title: "CTC", dataIndex: "ctcLpa", key: "c", render: (v) => (v == null ? "-" : `${v} LPA`) },
              { title: "Status", dataIndex: "status", key: "s", render: (s) => { const [t, c] = OFFER_STATUS[s] || [s, "default"]; return <Tag color={c}>{t}</Tag>; } },
              { title: "Reply by", dataIndex: "respondBy", key: "r", render: (v) => (v ? momentFromApi(v).format("D MMM, h:mm A") : "-") },
              { title: "Joining status", key: "j", render: (_, o) => (o.joiningStatus ? JOINING[o.joiningStatus] || o.joiningStatus : o.joiningDate ? momentFromApi(o.joiningDate).format("D MMM YYYY") : "-") },
            ]} />
        )}
      {/* A finished drive takes no new selections (BE-0139; the server refuses them too). */}
      {finished
        ? <Alert type="info" showIcon message="This drive is finished, so a selection list can no longer be sent." />
        : <Collapse ghost items={[{ key: "send", label: "Send your selection list (who you want to hire)", children: <SelectionsTab collegeId={collegeId} jobId={jobId} applicants={applicants} onSent={load} /> }]} />}
    </Space>
  );
}

function ApplicantsTab({ data, jobTitle, collegeId, jobId, onOpen, notes = {} }) {
  const [zipping, setZipping] = useState(false);
  const zippingRef = useRef(false);
  const hasNotes = Object.keys(notes).length > 0;
  if (!data.shared) return <Alert type="info" showIcon message="The placement cell has not shared the applicants yet" description="When they share the list, it appears here with the same details a link would show." />;
  // Name and stage first; the reference code only in the download; a column nobody has a value in is left out (UX audit,
  // 19 Oct 2026: "Applicant ID" led the table, there was no stage, and "UG %" was "-" for everyone).
  const shared = data.columns.flatMap((c) => (c === "projects" ? ["github", "portfolio"] : [c]));
  const ordered = ["name", "stage", ...shared.filter((c) => c !== "name" && c !== "stage")].filter((c, i, a) => a.indexOf(c) === i && (c === "name" || shared.includes(c)));
  const keys = ordered.filter((k) => data.applicants.some((r) => r[k] != null && r[k] !== ""));
  const tableKeys = keys.length ? keys : ["applicantId"];
  const csvColumns = [...tableKeys, "applicantId"].filter((c, i, a) => a.indexOf(c) === i).map((k) => ({ title: k === "applicantId" ? "Reference" : columnLabel(k), value: (r) => (k === "stage" && r[k] ? (STAGE_LABEL[String(r[k]).toUpperCase()] || r[k]) : r[k]) }));
  const columns = tableKeys.map((k) => ({ title: columnLabel(k), dataIndex: k, key: k,
    render: (v) => (["resume", "github", "portfolio"].includes(k) && v ? (safeHref(v) ? <a href={safeHref(v)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>Open</a> : "Link not shown")
      : k === "stage" && v ? (STAGE_LABEL[String(v).toUpperCase()] || String(v)) : v == null || v === "" ? "-" : String(v)) }));
  const downloadZip = async () => {
    if (zippingRef.current) return;
    zippingRef.current = true;
    setZipping(true);
    try {
      const r = await downloadDriveResumesZip(collegeId, jobId);
      const url = URL.createObjectURL(new Blob([r.data], { type: "application/zip" }));
      const a = document.createElement("a");
      a.href = url; a.download = `resumes-${jobTitle || "drive"}.zip`; a.click();
      URL.revokeObjectURL(url);
    } catch (_) { message.error("Could not prepare the resumes."); }
    zippingRef.current = false;
    setZipping(false);
  };
  return (
    <Space direction="vertical" className="recruiter-drive-detail__tab-stack">
      <Space className="recruiter-drive-detail__tab-actions" wrap>
        <Button onClick={() => downloadCsv(`applicants-${jobTitle || "drive"}`, csvColumns, data.applicants)}>Download list (CSV)</Button>
        {data.columns.includes("resume") && <Button loading={zipping} onClick={downloadZip}>Download resumes (ZIP)</Button>}
      </Space>
      <Table size="small" rowKey="applicantId" dataSource={data.applicants} columns={hasNotes ? [...columns, { title: "Your rating", key: "__rating", render: (_, r) => (notes[r.applicantId]?.rating ? <Rate disabled value={notes[r.applicantId].rating} /> : "-") }] : columns} pagination={{ pageSize: 25 }} scroll={{ x: "max-content" }} onRow={onOpen ? (r) => ({ onClick: () => onOpen(r), style: { cursor: "pointer" } }) : undefined} />
    </Space>
  );
}

function ResultsTab({ collegeId, jobId, rounds, applicants, onSent }) {
  const [roundId, setRoundId] = useState(rounds[0]?.id || null);
  const [choices, setChoices] = useState({});
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [pickedIds, setPickedIds] = useState([]);
  const setMany = (outcome) => { setChoices((cur) => ({ ...cur, ...Object.fromEntries(pickedIds.map((id) => [id, outcome])) })); setPickedIds([]); };
  const round = rounds.find((r) => r.id === roundId);
  if (!rounds.length) return <Empty description="No rounds set up on this drive yet" />;
  if (!applicants.length) return <Alert type="info" showIcon message="Results need the shared applicant list" />;
  const rows = Object.entries(choices).filter(([, v]) => v).map(([applicantId, outcome]) => ({ applicantId, outcome }));
  const byOutcome = OUTCOMES.map((o) => ({ ...o, count: rows.filter((r) => r.outcome === o.value).length })).filter((o) => o.count > 0);
  const doSend = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const r = await submitRoundResults(collegeId, jobId, roundId, rows);
      message.success(r?.data?.applied ? "Applied" : "Sent to the placement cell to verify");
      setChoices({}); onSent();
    } catch (e) { message.error(errorText(e, "Could not send the results")); }
    busyRef.current = false;
    setBusy(false);
  };
  const changeRound = (nextRoundId) => {
    if (nextRoundId === roundId) return;
    if (!Object.values(choices).some(Boolean)) {
      setRoundId(nextRoundId);
      setChoices({});
      setPickedIds([]);
      return;
    }
    Modal.confirm({
      title: "Discard unsent result decisions?",
      content: "Changing rounds will clear the result choices you have not sent yet.",
      okText: "Change round",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => {
        setRoundId(nextRoundId);
        setChoices({});
        setPickedIds([]);
      },
    });
  };
  const send = () => {
    Modal.confirm({
      title: `Send ${rows.length} result${rows.length === 1 ? "" : "s"}?`,
      content: (
        <Space direction="vertical">
          {byOutcome.map((o) => <Typography.Text key={o.value}>{o.count} × {o.label}</Typography.Text>)}
        </Space>
      ),
      okText: "Send",
      onOk: doSend,
    });
  };
  return (
    <Space direction="vertical" className="recruiter-drive-detail__tab-stack">
      <Select className="recruiter-drive-detail__round-select" value={roundId} onChange={changeRound} options={rounds.map((r) => ({ value: r.id, label: `${r.seq}. ${r.name}` }))} />
      {round && <Typography.Text type="secondary">{round.resultsWaiting} waiting for the placement cell · {round.resultsApplied} applied</Typography.Text>}
      <Space wrap data-testid="recruiter.results.bulk">
        <Typography.Text type="secondary">{pickedIds.length ? `${pickedIds.length} selected:` : "Tick rows to set many at once:"}</Typography.Text>
        {OUTCOMES.map((o) => <Button key={o.value} size="small" disabled={!pickedIds.length} onClick={() => setMany(o.value)}>{o.label}</Button>)}
        {pickedIds.length > 0 && <Button size="small" type="link" onClick={() => setPickedIds([])}>Clear selection</Button>}
      </Space>
      <Table size="small" rowKey="applicantId" dataSource={applicants} pagination={{ pageSize: 25 }} rowSelection={{ selectedRowKeys: pickedIds, onChange: setPickedIds }}
        columns={[{ title: "Applicant", key: "a", render: (_, a) => <span>{label(a)} <Typography.Text type="secondary">{a.applicantId}</Typography.Text></span> },
          { title: "Outcome", key: "o", render: (_, a) => <Select allowClear placeholder="No change" style={{ width: 190 }} value={choices[a.applicantId]} options={OUTCOMES} onChange={(v) => setChoices({ ...choices, [a.applicantId]: v })} /> }]} />
      <Button type="primary" loading={busy} disabled={busy || !rows.length} onClick={send}>Send {rows.length} result(s)</Button>
    </Space>
  );
}

function SlotsTab({ collegeId, jobId, rounds }) {
  const [roundId, setRoundId] = useState(rounds[0]?.id || null);
  const [slots, setSlots] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [form] = Form.useForm();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const loadSeq = useRef(0);
  const load = useCallback(() => {
    if (!roundId) return;
    const requestId = ++loadSeq.current;
    setLoadError(null);
    listRoundSlots(collegeId, jobId, roundId)
      .then((r) => {
        if (requestId !== loadSeq.current) return;
        if (!Array.isArray(r?.data)) throw new Error("Invalid slot response");
        setSlots(r.data);
      })
      .catch((e) => {
        if (requestId !== loadSeq.current) return;
        setLoadError(errorText(e, "Could not load interview slots"));
      });
  }, [collegeId, jobId, roundId]);
  useEffect(() => { setSlots(null); load(); }, [load]);
  if (!rounds.length) return <Empty description="No rounds set up on this drive yet" />;
  const changeRound = (nextRoundId) => {
    if (nextRoundId === roundId || busyRef.current) return;
    if (!form.isFieldsTouched()) {
      form.resetFields();
      setRoundId(nextRoundId);
      return;
    }
    Modal.confirm({
      title: "Discard this unsent slot proposal?",
      content: "The proposed time, capacity, and panel belong to the current round.",
      okText: "Change round",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => {
        form.resetFields();
        setRoundId(nextRoundId);
      },
    });
  };
  const add = async () => {
    if (busyRef.current || loadError) return;
    let v;
    try { v = await form.validateFields(); } catch (_) { return; }
    busyRef.current = true;
    setBusy(true);
    try {
      await proposeRoundSlots(collegeId, jobId, roundId, [{ startsAt: serverTime(v.range[0]), endsAt: serverTime(v.range[1]), capacity: v.capacity || 1, panel: v.panel || null }]);
      message.success("Proposed. The placement cell will confirm and add a room."); form.resetFields(); load();
    } catch (e) { message.error(errorText(e, "Could not propose the slot")); }
    busyRef.current = false;
    setBusy(false);
  };
  return (
    <Space direction="vertical" className="recruiter-drive-detail__tab-stack">
      <Select className="recruiter-drive-detail__round-select" value={roundId} onChange={changeRound} options={rounds.map((r) => ({ value: r.id, label: `${r.seq}. ${r.name}` }))} />
      <Card className="recruiter-drive-detail__subcard" size="small" title="Propose a slot">
        <Form form={form} layout="inline">
          <Form.Item name="range" rules={[{ required: true, message: "Pick a start and end" }]}><DatePicker.RangePicker showTime disabledDate={(d) => d && d.isBefore(dj().startOf("day"))} /></Form.Item>
          <Form.Item name="capacity"><InputNumber min={1} placeholder="Students" /></Form.Item>
          <Form.Item name="panel"><Input placeholder="Panel (optional)" /></Form.Item>
          <Button type="primary" loading={busy} disabled={busy || Boolean(loadError)} onClick={add}>Propose</Button>
        </Form>
      </Card>
      {loadError ? <Alert type="warning" showIcon message="Interview slots could not be loaded" description={loadError} action={<Button size="small" onClick={load}>Retry</Button>} />
        : slots === null ? <Skeleton active paragraph={{ rows: 2 }} />
        : <List size="small" locale={{ emptyText: "No slots yet" }} dataSource={slots} renderItem={(s) => (
        <List.Item>{dj(s.startsAt).format("D MMM, h:mm A")} to {dj(s.endsAt).format("h:mm A")}{s.panel ? ` · ${s.panel}` : ""}{s.room ? ` · ${s.room}` : ""} <Tag color={s.status === "CONFIRMED" ? "green" : "gold"}>{s.status === "CONFIRMED" ? "Confirmed" : "Waiting for the placement cell"}</Tag></List.Item>
      )} />}
    </Space>
  );
}

function SelectionsTab({ collegeId, jobId, applicants, onSent }) {
  const [selected, setSelected] = useState([]);
  const [form] = Form.useForm();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  if (!applicants.length) return <Alert type="info" showIcon message="The selection list needs the shared applicant list" />;
  const doSend = async (v) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const r = await submitSelectionList(collegeId, jobId, { applicantIds: selected, roleOption: v.roleOption || null, ctcLpa: v.ctcLpa, kind: v.kind });
      message.success(`${r?.data?.recorded ?? selected.length} sent. The placement cell verifies each before students see an offer.`);
      setSelected([]);
      onSent?.();
    } catch (e) { message.error(errorText(e, "Could not send the list")); }
    busyRef.current = false;
    setBusy(false);
  };
  // This is the highest-stakes action on the page - it's a literal offer/LOI, with a hand-typed
  // CTC - so it gets the same "review before it goes out" step as every other high-impact send.
  const send = async () => {
    const v = await form.validateFields();
    const kindLabel = v.kind === "LOI" ? "Letter of intent" : "Offer";
    Modal.confirm({
      title: `Send ${selected.length} ${kindLabel.toLowerCase()}${selected.length === 1 ? "" : "s"}?`,
      content: (
        <Space direction="vertical">
          <Typography.Text>{kindLabel} at <b>{v.ctcLpa} LPA</b>{v.roleOption ? ` · ${v.roleOption}` : ""}</Typography.Text>
          {(v.ctcLpa < 0.5 || v.ctcLpa > 100) && <Typography.Text type="warning">That CTC looks unusual - please double-check it.</Typography.Text>}
          <Typography.Text type="secondary">The placement cell verifies each one before the student sees it.</Typography.Text>
        </Space>
      ),
      okText: "Send",
      onOk: () => doSend(v),
    });
  };
  return (
    <Space direction="vertical" className="recruiter-drive-detail__tab-stack">
      <Form className="recruiter-drive-detail__selection-form" form={form} layout="inline" initialValues={{ kind: "OFFER" }}>
        <Form.Item name="kind"><Select style={{ width: 150 }} options={[{ value: "OFFER", label: "Offer" }, { value: "LOI", label: "Letter of intent" }]} /></Form.Item>
        <Form.Item name="roleOption"><Input placeholder="Package (optional), e.g. Digital" /></Form.Item>
        <Form.Item name="ctcLpa" rules={[{ required: true, message: "CTC in LPA" }]}><InputNumber min={0} step={0.1} placeholder="CTC (LPA)" /></Form.Item>
      </Form>
      <Table size="small" rowKey="applicantId" dataSource={applicants} pagination={{ pageSize: 25 }} rowSelection={{ selectedRowKeys: selected, onChange: setSelected }}
        columns={[{ title: "Applicant", key: "a", render: (_, a) => <span>{label(a)} <Typography.Text type="secondary">{a.applicantId}</Typography.Text></span> }, { title: "Stage", dataIndex: "stage", key: "stage", render: (v) => (v ? STAGE_LABEL[String(v).toUpperCase()] || v : "-") }]} />
      <Button type="primary" loading={busy} disabled={busy || !selected.length} onClick={send}>Send {selected.length} selected</Button>
    </Space>
  );
}

const MAX_MESSAGE = 4000;

/**
 * The drive's conversation with the placement cell. It also shows the drive's change requests as lines (who asked, accepted,
 * answered, declined), and a message can quote a request ("Discuss" on the Requests tab).
 */
function MessagesTab({ collegeId, jobId, quote, onQuoteClear, onSeeRequest, refreshKey }) {
  const [threadId, setThreadId] = useState(null);
  const [rows, setRows] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const sendingRef = useRef(false);
  useEffect(() => {
    if (!body.trim() || typeof window === "undefined") return undefined;
    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeRouteChange = () => {
      if (window.confirm("Discard this unsent drive message?")) return;
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) window.history.pushState(null, "", Router.asPath);
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted to preserve recruiter message draft.";
    };
    window.addEventListener("beforeunload", beforeUnload);
    Router.events.on("routeChangeStart", beforeRouteChange);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      Router.events.off("routeChangeStart", beforeRouteChange);
    };
  }, [body]);
  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const t = await listHrThreads(collegeId);
      if (!Array.isArray(t?.data)) throw new Error("Invalid thread response");
      const mine = t.data.find((x) => x.jobId === jobId);
      setThreadId(mine?.id || null);
      if (mine) {
        const m = await getHrThread(collegeId, mine.id);
        if (!Array.isArray(m?.data)) throw new Error("Invalid message history response");
        setRows(m.data);
      } else {
        setRows([]);
      }
    } catch (e) {
      setLoadError(errorText(e, "Could not load this drive conversation"));
    }
  }, [collegeId, jobId]);
  useEffect(() => { setRows(null); load(); }, [load]);
  // A reply from the placement cell shows when you come back to the tab; a request settled on this page shows at once.
  useRefreshOnFocus(load);
  // Live: the placement cell's message (or their reading yours) shows within seconds while this tab is open.
  const pulse = useCallback(() => getRecruiterMessagesPulse(collegeId), [collegeId]);
  useLivePulse(pulse, load, { active: Boolean(collegeId) });
  const firstKey = useRef(true);
  useEffect(() => {
    if (firstKey.current) { firstKey.current = false; return; }
    load();
  }, [refreshKey, load]);
  const send = async () => {
    if (sendingRef.current || !body.trim() || loadError) return;
    sendingRef.current = true;
    setSending(true);
    setSendError(null);
    try {
      await sendRecruiterMessage(collegeId, jobId, body.trim(), quote ? quote.id : null);
      setBody("");
      onQuoteClear?.();
      await load();
    } catch (e) {
      // Stays on screen with the reason; the draft is kept for another try.
      setSendError(errorText(e, "Could not send"));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };
  const ordered = useMemo(() => Array.isArray(rows) ? rows : [], [rows]);
  return (
    <Space direction="vertical" className="recruiter-drive-detail__tab-stack recruiter-drive-detail__messages">
      <Typography.Text type="secondary">Between you and the placement cell. Students never see this, and the placement team&apos;s internal notes stay separate.</Typography.Text>
      {loadError ? <Alert type="warning" showIcon message="Conversation could not be loaded" description={loadError} action={<Button size="small" onClick={load}>Retry</Button>} />
        : rows === null ? <Skeleton active paragraph={{ rows: 3 }} />
        : <List className="recruiter-drive-detail__message-list" size="small" locale={{ emptyText: threadId ? "No messages" : "No messages yet. Say hello to the placement cell." }} dataSource={ordered} renderItem={(m) => {
          // The placement cell's teammate by name; "Placement cell" only when the name is unknown.
          const who = m.senderType === "RECRUITER" ? "You" : (m.senderName || "Placement cell");
          const when = dj(m.createdAt).format("D MMM, h:mm A");
          if (m.kind === "EVENT") return <List.Item><RequestEventLine message={m} who={who} when={when} onSeeRequest={onSeeRequest} /></List.Item>;
          return (
            <List.Item>
              <div className="recruiter-drive-detail__message">
                <b>{who}</b> <Typography.Text type="secondary">{when}{m.via === "EMAIL" ? " · by email" : ""}</Typography.Text>
                {m.request && <RequestQuote request={m.request} onSeeRequest={onSeeRequest} />}
                <div className="recruiter-drive-detail__message-body">{m.body}</div>
              </div>
            </List.Item>
          );
        }} />}
      {sendError && <Alert type="error" showIcon closable message="Message was not sent" description={sendError} onClose={() => setSendError(null)} />}
      {quote && <RequestQuote request={quote} onRemove={onQuoteClear} />}
      <Input.TextArea rows={3} value={body} maxLength={MAX_MESSAGE} showCount={body.length > MAX_MESSAGE - 500} disabled={Boolean(loadError) || sending}
        onChange={(e) => setBody(e.target.value)} placeholder={quote ? "Write about this request" : "Write to the placement cell about this drive"} aria-label="Message" />
      <Button type="primary" loading={sending} disabled={sending || Boolean(loadError) || !body.trim()} onClick={send}>Send</Button>
    </Space>
  );
}
