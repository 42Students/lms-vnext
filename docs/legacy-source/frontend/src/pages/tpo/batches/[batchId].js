import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import Link from "next/link";
import { Alert, Button, Empty, Modal, Space, Tabs, Tag, Timeline, Tooltip, Typography, message } from "antd";
import { ArrowLeftOutlined, ThunderboltOutlined, UndoOutlined } from "@ant-design/icons";
import PageShell from "@/components/Common/PageShell";
import { PanelError, StatusBadge } from "@/components/Common/PanelStates";
import { DetailSkeleton, TableSkeleton } from "@/components/Common/Skeletons";
import ImportPreviewModal from "@/components/tpo/ImportPreviewModal";
import EligibilityGrid from "@/components/tpo/batches/EligibilityGrid";
import IneligibleModal from "@/components/tpo/batches/IneligibleModal";
import BatchRulesTab from "@/components/tpo/batches/BatchRulesTab";
import { BatchStrip, NextStep, WhoIsIn } from "@/components/tpo/batches/BatchTop";
import StudentActions from "@/components/tpo/students/StudentActions";
import useBulkAction from "@/components/tpo/bulk/BulkAction";
import useUrlFilters from "@/components/tpo/filters/useUrlFilters";
import { activeCount, mergeQuery } from "@/components/tpo/filters/filterModel";
import { STATE, batchStage, batchYears, decisionLabel, gridFilterDefs, learnerChanges } from "@/components/tpo/batches/batchRules";
import { dj } from "@/components/tpo/dj";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getStudentsTable } from "@/api/Services/TpoHubService";
import { getSafeInternalReturnPath } from "@/utils/navigationContext";
import {
  commitEligibilityImport, decideEligibility, getBatch, getBatchStudents, inviteBatch, previewEligibilityImport, remindBatch, undoEligibility, updateBatch,
} from "@/api/Services/BatchesService";

const errorText = (res, fallback) => res?.data?.error || res?.data?.message || res?.message || fallback;
// Three tabs: the batch page owns getting students into placements (decide, invite, register) on one screen; Classes and
// Registration were folded into the "Who is in" block and the Next step card. Old links to them land on Students.
const TABS = ["students", "rules", "history"];
const importRows = (rows) => rows.map((r) => ({ roll: r.roll, decision: r.outcome, reason: r.reasonCategory || r.comment }));
// What usually comes next after a gap or a link on the strip: offered in the act bar, never forced.
const SUGGESTED = {
  B_GAP_UNDECIDED: { action: "eligible", text: "make them eligible" },
  B_GAP_NOT_INVITED: { invite: true, text: "invite the batch (Next step, above)" },
  B_GAP_NOT_REGISTERED: { action: "message", message: "register", text: "remind them to register" },
  B_NO_RESUME: { action: "message", message: "resume", text: "ask them to upload a resume" },
  B_OWN: { action: "follow", text: "let them follow their class" },
};

/** One batch: getting its students into placements (decide, invite, register), its rules and its history. */
export default function TpoBatch() {
  const dispatch = useDispatch();
  const router = useRouter();
  const batchId = router.query.batchId;
  const tab = TABS.includes(router.query.tab) ? router.query.tab : "students";
  const batchesReturnPath = getSafeInternalReturnPath(router.query?.returnTo, {
    fallback: "/tpo/batches",
    allowedPrefixes: ["/tpo/batches"],
  });
  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState(null);
  const [profiles, setProfiles] = useState({}); // learnerId -> the Students page's row (stage, resume, phone, submitted sections...)
  const [error, setError] = useState(null);
  const [studentsError, setStudentsError] = useState(null);
  const [profilesError, setProfilesError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [ineligible, setIneligible] = useState(null); // { scopeType, scopeId, what }
  const [busy, setBusy] = useState(false);
  const actionRef = useRef(false);
  const loadSeqRef = useRef(0);
  const [importing, setImporting] = useState(false);
  const [deadline, setDeadline] = useState(null);
  const [acting, setActing] = useState(null); // { audience, selected, initial, clear }
  const [flash, setFlash] = useState(0); // "Show me": flashes the Next step card
  const [startBulk, bulkElement] = useBulkAction();
  const invited = Boolean(batch?.invitedAt);
  const defs = useMemo(() => gridFilterDefs(batch?.classes, invited), [batch?.classes, invited]);
  const [filters, setFilters] = useUrlFilters(defs);

  useEffect(() => { dispatch(appAction.setActiveMenuItem("batches")); }, [dispatch]);
  const load = useCallback(async () => {
    if (!batchId) return false;
    const requestId = ++loadSeqRef.current;
    setRefreshing(true);
    const [b, s, p] = await Promise.all([
      fetchWithErrorHandling(getBatch(batchId)),
      fetchWithErrorHandling(getBatchStudents(batchId)),
      fetchWithErrorHandling(getStudentsTable({ everyone: true })),
    ]);
    if (requestId !== loadSeqRef.current) return false;
    setRefreshing(false);

    if (!b.success) {
      setError(errorText(b, "Could not load this batch"));
      return false;
    }

    setError(null);
    setBatch(b.data);
    setDeadline(b.data?.registrationDeadline ? dj(b.data.registrationDeadline) : null);

    if (s.success) {
      setStudents(Array.isArray(s.data) ? s.data : []);
      setStudentsError(null);
    } else {
      // Keep last-known roster if this is a refresh. On first load, the Students tab renders an
      // explicit error instead of spinning forever or pretending the batch has zero students.
      setStudentsError(errorText(s, "Could not load this batch's students"));
    }

    if (p.success) {
      setProfiles(Object.fromEntries((p.data?.students || []).map((row) => [String(row.learnerId), row])));
      setProfilesError(null);
    } else {
      // Student-table enrichment drives stage/resume/filter/action context. Missing enrichment is
      // partial state, not permission to silently run those affordances on incomplete rows.
      setProfilesError(errorText(p, "Could not load placement profile details for these students"));
    }
    return true;
  }, [batchId]);

  useEffect(() => {
    setBatch(null);
    setStudents(null);
    setProfiles({});
    setError(null);
    setStudentsError(null);
    setProfilesError(null);
    load();
  }, [batchId, load]);

  // The batch's own fields win; the Students row fills in what the filters and actions need.
  const rows = useMemo(() => (students || []).map((s) => ({ ...(profiles[String(s.learnerId)] || {}), ...s })), [students, profiles]);

  const setTab = (key) => router.replace({ pathname: router.pathname, query: { ...router.query, tab: key } }, undefined, { shallow: true, scroll: false });

  const undo = async (actionId) => {
    if (actionRef.current) return;
    actionRef.current = true;
    setBusy(true);
    try {
      const res = await fetchWithErrorHandling(undoEligibility(actionId));
      if (!res.success) { message.error(errorText(res, "Could not undo")); return; }
      message.success("Undone");
      void load();
    } finally {
      actionRef.current = false;
      setBusy(false);
    }
  };

  /** Every decision on this page goes through here: save, reload, and offer Undo. */
  const decide = async (changes, what) => {
    if (actionRef.current) return false;
    actionRef.current = true;
    setBusy(true);
    try {
      const res = await fetchWithErrorHandling(decideEligibility(changes));
      if (!res.success) { message.error(errorText(res, "Could not save the decision")); return false; }
      const n = Number(res.data?.changed) || 0;
      const actionId = res.data?.actionId;
      if (n === 0) message.info("Nothing changed");
      else {
        const key = `elig-${actionId}`;
        message.success({
          key, duration: 8,
          content: (
            <span>
              Saved {n} decision{n === 1 ? "" : "s"}{what ? ` for ${what}` : ""}.{" "}
              <Button size="small" type="link" onClick={() => { message.destroy(key); undo(actionId); }}>Undo</Button>
            </span>
          ),
        });
      }
      await load();
      return true;
    } finally {
      actionRef.current = false;
      setBusy(false);
    }
  };

  const decideScope = (scopeType, scopeId, what) => (status) => {
    if (status === "INELIGIBLE") { setIneligible({ scopeType, scopeId, what }); return; }
    decide([{ scopeType, scopeId, status }], what);
  };

  const setFinished = (finished) => Modal.confirm({
    title: finished ? `Mark ${batch.name} as finished?` : `Reopen ${batch.name}?`,
    content: finished
      ? "It leaves the working set: hidden from Placement eligibility by default and left out of counts. Its students can't apply on their own; you can still add them to a drive."
      : "It comes back into the working set and its eligible students can use placements again.",
    okText: finished ? "Mark finished" : "Reopen",
    onOk: async () => {
      if (actionRef.current) return;
      actionRef.current = true;
      setBusy(true);
      try {
        const res = await fetchWithErrorHandling(updateBatch(batchId, { finished }));
        if (!res.success) { message.error(errorText(res, "Could not save")); return; }
        message.success(finished ? "Batch finished" : "Batch reopened");
        void load();
      } finally {
        actionRef.current = false;
        setBusy(false);
      }
    },
  });

  // Placement times are stored in UTC (dj reads them back as UTC): end of the picked day here, sent as UTC.
  const deadlineValue = (d) => (d ? new Date(d.hour(23).minute(59).second(0).millisecond(0).valueOf()).toISOString().slice(0, 19) : null);

  /** First time: invite (opens registration and tells students). Afterwards: move the deadline and tell them. */
  const invite = async () => {
    if (!deadline) { message.warning("Pick the registration deadline first"); return; }
    if (actionRef.current) return;
    actionRef.current = true;
    setBusy(true);
    try {
      const res = await fetchWithErrorHandling(inviteBatch(batchId, deadlineValue(deadline)));
      if (!res.success) { message.error(errorText(res, "Could not invite")); return; }
      const n = Number(res.data?.invited) || 0;
      message.success(n > 0 ? `Invited ${n} student${n === 1 ? "" : "s"} to register by ${deadline.format("D MMM")}` : `Deadline set to ${deadline.format("D MMM")}`);
      void load();
    } finally {
      actionRef.current = false;
      setBusy(false);
    }
  };

  const moveDeadline = async () => {
    if (actionRef.current) return;
    actionRef.current = true;
    setBusy(true);
    try {
      const res = await fetchWithErrorHandling(updateBatch(batchId, { setDeadline: true, registrationDeadline: deadlineValue(deadline) }));
      if (!res.success) { message.error(errorText(res, "Could not save the deadline")); return; }
      message.success(deadline ? "Deadline moved" : "Deadline removed");
      void load();
    } finally {
      actionRef.current = false;
      setBusy(false);
    }
  };

  const remind = () => {
    const left = Math.max(0, (Number(batch.eligible) || 0) - (Number(batch.registered) || 0));
    Modal.confirm({
      title: `Remind ${left} student${left === 1 ? "" : "s"} to register?`,
      content: "Eligible students of this batch who have not chosen Placements, Higher studies or Not interested get a reminder with the deadline.",
      okText: "Send reminder",
      onOk: async () => {
        if (actionRef.current) return;
        actionRef.current = true;
        setBusy(true);
        try {
          const res = await fetchWithErrorHandling(remindBatch(batchId));
          if (!res.success) { message.error(errorText(res, "Could not send the reminder")); return; }
          const n = Number(res.data?.reminded) || 0;
          message.success(n > 0 ? `Reminded ${n} student${n === 1 ? "" : "s"}` : "Everyone has chosen already");
        } finally {
          actionRef.current = false;
          setBusy(false);
        }
      },
    });
  };

  // ---- the strip and the act bar ----------------------------------------------------------------------------------------
  const picked = (filters.bjourney || []).length === 1 ? filters.bjourney[0] : null;
  const pickStrip = (key) => {
    const next = { ...filters };
    delete next.bjourney;
    if (key !== "B_ALL" && key !== picked) next.bjourney = [key];
    setFilters(next);
  };
  const pickedClass = (filters.class || []).length === 1 ? filters.class[0] : null;
  // From the Who is in block: filter the sheet and show the Students tab in ONE address update (two updates raced, and the
  // second wiped the filter).
  const showOnSheet = (next) => router.replace({ pathname: router.pathname, query: mergeQuery({ ...router.query, tab: "students" }, defs, next) },
    undefined, { shallow: true, scroll: false });
  const pickClass = (id) => {
    const next = { ...filters };
    if (pickedClass === id) delete next.class; else next.class = [id];
    showOnSheet(next);
  };
  const pickOwn = () => {
    const next = { ...filters };
    delete next.bjourney;
    if (picked !== "B_OWN") next.bjourney = ["B_OWN"];
    showOnSheet(next);
  };
  const narrowedBy = activeCount(defs.filter((d) => d.key !== "bjourney"), filters);
  const registerText = batch?.registrationDeadline
    ? `Registration for placements closes on ${dj(batch.registrationDeadline).format("D MMM")}. Please choose Placements, Higher studies or Not interested in your Placements page.`
    : null;
  // Decisions from the Actions window go through the same preview -> result -> Undo as every other action (making 50 students
  // ineligible used to be one click).
  const decideRows = (status, list, reason, clear) => {
    if (!list.length) return;
    const title = status === "ELIGIBLE" ? "Make eligible" : status === "INELIGIBLE" ? "Make ineligible" : "Follow class";
    const placed = status === "INELIGIBLE" ? list.filter((r) => r.placed || batchStage(r) === "PLACED") : [];
    const placedNote = placed.length
      ? ` ${placed.length === 1 ? `${placed[0].name} is placed` : `${placed.length} of them are placed (${placed.slice(0, 3).map((r) => r.name).join(", ")}${placed.length > 3 ? " and others" : ""})`}: offers stay, they only leave placements.`
      : "";
    startBulk({
      title, noun: ["student", "students"], items: list, nameOf: (r) => r.name, danger: status === "INELIGIBLE",
      consequence: status === "ELIGIBLE" ? "They are in placements on their own decision, whatever their class or batch says."
        : status === "INELIGIBLE" ? `They are out of placements. Reason (students never see it): ${String(reason || "").replace(/\.$/, "")}.${placedNote}`
          : "Their own decision is removed; their class and batch decide again.",
      run: (items) => fetchWithErrorHandling(decideEligibility(learnerChanges(items, status, reason))),
      undo: (_, res) => fetchWithErrorHandling(undoEligibility(res?.data?.actionId)),
      undoWhen: "You can undo this until someone at your college makes the next decision.",
      // The server's own count, not the rows sent.
      summary: (res) => {
        const n = Number(res?.data?.changed);
        if (Number.isNaN(n)) return null;
        return n === 0 ? "Nothing changed." : `${n.toLocaleString()} decision${n === 1 ? "" : "s"} changed.`;
      },
      onDone: () => { clear?.(); load(); },
    });
  };
  const act = (shown, selected, clear) => {
    const audience = selected.length ? selected : shown;
    const tip = !selected.length && picked && SUGGESTED[picked];
    const doTip = () => {
      if (tip.invite) { document.getElementById("batch-next-step")?.scrollIntoView({ behavior: "smooth", block: "center" }); setFlash((f) => f + 1); return; }
      setActing({ audience: shown, selected: false, initial: { ...tip, prefill: tip.message === "register" ? registerText : null }, clear });
    };
    return (
      <>
        <span className="tpo-elig__act-text">
          {selected.length ? <><strong>{selected.length.toLocaleString()}</strong> selected of {shown.length.toLocaleString()}</> : <><strong>{shown.length.toLocaleString()}</strong> {shown.length === 1 ? "student" : "students"} in this view</>}
        </span>
        <Button type={selected.length ? "primary" : "default"} icon={<ThunderboltOutlined />} style={audience.length === 0 ? { display: "none" } : undefined} disabled={audience.length === 0} data-testid="batch.act"
          onClick={() => setActing({ audience, selected: selected.length > 0, initial: null, clear })}>
          {selected.length ? `Act on ${selected.length.toLocaleString()} selected` : `Act on all ${shown.length.toLocaleString()}`}
        </Button>
        {tip && shown.length > 0 && (
          <span className="tpo-elig__suggest" data-testid="batch.suggest">
            Suggested: {tip.text}
            <Button size="small" onClick={doTip} data-testid="batch.suggest-do">{tip.invite ? "Show me" : "Do it"}</Button>
          </span>
        )}
      </>
    );
  };

  if (error && !batch) return <div className="scroll-container tpo-batch"><PageShell><PanelError title={error} onRetry={load} /></PageShell></div>;
  if (!batch) return <div className="scroll-container tpo-batch"><PageShell><DetailSkeleton label="Loading placement batch" withMedia={false} /></PageShell></div>;

  const state = STATE[batch.state] || STATE.NOT_STARTED;
  const finished = batch.state === "FINISHED";
  const classes = batch.classes || [];

  const historyTab = (batch.history || []).length === 0 ? <Empty description="No decisions yet" /> : (
    <Timeline className="tpo-batch__history" items={(batch.history || []).map((h, i) => ({
      key: i,
      color: h.afterStatus === "ELIGIBLE" ? "green" : h.afterStatus === "INELIGIBLE" ? "red" : "gray",
      children: (
        <div className={h.undoneAt ? "is-undone" : ""}>
          <strong>{h.scopeName || h.scopeType}</strong>{" "}
          <Typography.Text type="secondary">({h.scopeType === "LEARNER" ? "student" : h.scopeType.toLowerCase()})</Typography.Text>{" "}
          {decisionLabel(h.beforeStatus)} → <strong>{decisionLabel(h.afterStatus)}</strong>
          {h.reason && <Typography.Text type="secondary"> · {h.reason}</Typography.Text>}
          <div className="tpo-batch__history-meta">
            {h.actorName || "Someone"} · {dj(h.at).format("D MMM YYYY, h:mm a")}{h.undoneAt && " · undone"}
          </div>
        </div>
      ),
    }))} />
  );

  return (
    <div className="scroll-container tpo-batch" data-testid="tpo.batch">
      <PageShell>
        <Link href={batchesReturnPath} className="tpo-batch__back"><ArrowLeftOutlined /> Placement eligibility</Link>
        <header className="tpo-batch__head">
          <div>
            <h1 className="tpo-batch__title">{batch.name} <StatusBadge status={state.status} label={state.label} tone={state.tone} /></h1>
            <Typography.Text type="secondary">{[batch.department, batch.program, batchYears(batch)].filter(Boolean).join(" · ")}</Typography.Text>
          </div>
          <Space wrap className="tpo-batch__actions">
            {batch.lastAction?.actionId && (
              // The college's last decision, which may be on another batch: the tooltip says what it was.
              <Tooltip title={`${batch.lastAction.changes} ${Number(batch.lastAction.changes) === 1 ? "change" : "changes"} by ${batch.lastAction.actorName || "someone"}, ${dj(batch.lastAction.at).format("D MMM, h:mm a")}`}>
                <Button icon={<UndoOutlined />} onClick={() => undo(batch.lastAction.actionId)}>Undo last decision</Button>
              </Tooltip>
            )}
            <Button onClick={() => setFinished(!finished)}>{finished ? "Reopen batch" : "Mark finished"}</Button>
          </Space>
        </header>
        {error && (
          <Alert
            type="warning"
            showIcon
            className="tpo-batch__alert"
            message="Batch details may be stale"
            description={error}
            action={<Button size="small" loading={refreshing} onClick={load}>Retry</Button>}
          />
        )}
        {studentsError && students !== null && (
          <Alert
            type="warning"
            showIcon
            className="tpo-batch__alert"
            message="Student roster unavailable"
            description={studentsError}
            action={<Button size="small" loading={refreshing} onClick={load}>Retry roster</Button>}
          />
        )}
        {profilesError && (
          <Alert
            type="warning"
            showIcon
            className="tpo-batch__alert"
            message="Some student placement details are unavailable"
            description="The batch and roster are loaded, but stage, resume or related placement context may be incomplete. Actions that depend on those details are disabled until you retry."
            action={<Button size="small" loading={refreshing} onClick={load}>Retry details</Button>}
          />
        )}
        {batch.decision === "INELIGIBLE" && batch.decisionReason && (
          <Alert type="warning" showIcon banner className="tpo-batch__alert" message={`The batch is ineligible: ${batch.decisionReason}. Classes or students set to Eligible are still in placements.`} />
        )}
        <div className="tpo-batch__plan">
          <NextStep batch={batch} batchId={batchId} deadline={deadline} setDeadline={setDeadline} busy={busy} onInvite={invite} onMoveDeadline={moveDeadline} onRemind={remind} flash={flash} />
          <WhoIsIn batch={batch} batchId={batchId} classes={classes} rows={rows} decideScope={decideScope} disabled={finished || Boolean(studentsError)}
            pickedClass={pickedClass} onClass={pickClass} ownPicked={picked === "B_OWN"} onOwn={pickOwn} />
        </div>
        <Tabs activeKey={tab} onChange={setTab} className="tpo-batch__tabs" items={[
          {
            key: "students", label: `Students (${Number(batch.students) || 0})`,
            children: studentsError && students === null ? (
              <PanelError title={studentsError} onRetry={load} />
            ) : students === null ? <TableSkeleton rows={8} columns={6} label="Loading batch students" /> : (
              <EligibilityGrid students={rows} filters={filters} setFilters={setFilters} defs={defs}
                storageKey="batch-eligibility-v2" exportName={`${batch.name} eligibility`} decide={decide}
                readOnly={finished || Boolean(studentsError) || Boolean(profilesError)}
                onImport={() => setImporting(true)}
                top={<BatchStrip rows={rows} invited={invited} picked={picked} onPick={pickStrip} narrowedBy={narrowedBy} />}
                act={act} />
            ),
          },
          { key: "rules", label: "Rules", children: <BatchRulesTab key={batchId} /* BE-0116: another batch starts the rules afresh */ batchId={batchId} batchName={batch.name} /> },
          { key: "history", label: "History", children: historyTab },
        ]} />
      </PageShell>

      {bulkElement}
      <StudentActions open={Boolean(acting) && !finished && !studentsError && !profilesError} onClose={() => setActing(null)} audience={acting?.audience || []} selected={Boolean(acting?.selected)}
        initial={acting?.initial} startBulk={startBulk} only={["message", "note"]} readyMessages={{ register: invited ? registerText || undefined : null }} onDecide={(status, list, reason) => decideRows(status, list, reason, acting?.clear)}
        onChanged={() => { acting?.clear?.(); load(); }} />
      <IneligibleModal
        open={Boolean(ineligible)} what={ineligible?.what || ""} busy={busy} onCancel={() => setIneligible(null)}
        onConfirm={async (reason) => {
          setBusy(true);
          const ok = await decide([{ scopeType: ineligible.scopeType, scopeId: ineligible.scopeId, status: "INELIGIBLE", reason }], ineligible.what);
          setBusy(false);
          if (ok) setIneligible(null);
        }}
      />
      <ImportPreviewModal
        open={importing} title="Import eligibility" onClose={() => setImporting(false)}
        onDone={() => { setImporting(false); load(); }}
        allowed={["roll", "name", "outcome", "reasonCategory", "comment"]}
        preview={(rows2) => previewEligibilityImport(importRows(rows2))}
        commit={(rows2) => commitEligibilityImport(importRows(rows2))}
        groups={[{ key: "matched", label: "Matched", tone: "green" }, { key: "unmatched", label: "Can't use", tone: "red" }]}
        matchedColumns={[
          { title: "Roll no.", dataIndex: "roll" },
          { title: "Name", dataIndex: "name" },
          { title: "Now", dataIndex: "from", render: decisionLabel },
          { title: "Becomes", dataIndex: "to", render: (v, r) => (r.unchanged ? <Typography.Text type="secondary">No change</Typography.Text> : <strong>{decisionLabel(v)}</strong>) },
          { title: "Reason", dataIndex: "reason" },
        ]}
        template={{ name: "eligibility-template", headings: ["Roll number", "Decision", "Reason"], example: ["21A91A0501", "Eligible", ""] }}
        help="A sheet with Roll number, Decision (Eligible, Ineligible or Not decided) and Reason (needed for Ineligible). You'll see every change before it is saved."
      />
    </div>
  );
}
