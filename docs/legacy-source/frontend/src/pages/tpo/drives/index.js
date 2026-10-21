import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { Alert, Button, Card, DatePicker, Dropdown, Form, Tabs, Tag, Typography } from "antd";
import { EllipsisOutlined, PlusOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { dj, serverTime } from "@/components/tpo/dj";
import ActionsWindow from "@/components/tpo/ui/ActionsWindow";
import useBulkAction from "@/components/tpo/bulk/BulkAction";
import PageShell from "@/components/Common/PageShell";
import { PanelError } from "@/components/Common/PanelStates";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import TpoDataTable from "@/components/tpo/TpoDataTable";
import useUrlFilters from "@/components/tpo/filters/useUrlFilters";
import { activeCount, mergeQuery } from "@/components/tpo/filters/filterModel";
import { appAction } from "@/redux/store";
import { closeDrive, extendDeadline, listDrives, remindNotApplied } from "@/api/Services/TpoService";
import { getDriveCounts, getTeam } from "@/api/Services/TpoHubService";
import { categoryFromCtc } from "@/components/tpo/DriveFormPage";
import { getBatches } from "@/api/Services/BatchesService";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";

const TABS = {
  requests: {
    label: "Requests",
    description: "Recruiter requests waiting for review or sent back for changes.",
    test: (d) => ["REQUEST", "SENT_BACK"].includes(d.lifecycleStatus),
  },
  drafts: {
    label: "Drafts",
    description: "Drives your placement team is still preparing before publishing.",
    test: (d) => d.lifecycleStatus === "DRAFT",
  },
  live: {
    label: "Live",
    description: "Published drives students can currently see and act on.",
    test: (d) => d.lifecycleStatus === "PUBLISHED",
  },
  closed: {
    label: "Closed",
    description: "Completed, cancelled or declined drives kept for reference.",
    test: (d) => ["CLOSED", "CANCELLED", "REJECTED"].includes(d.lifecycleStatus),
  },
};
const STATUS_TAG = { REQUEST: ["Needs your review", "gold"], SENT_BACK: ["Sent back", "orange"], DRAFT: ["Draft", "default"], PUBLISHED: ["Live", "green"], CLOSED: ["Closed", "default"], CANCELLED: ["Cancelled", "red"], REJECTED: ["Declined", "default"] };
const MODE = { ON_CAMPUS: "On campus", POOL: "Pool", OFF_CAMPUS: "Off campus" };
const CATEGORY = (v) => String(v).replace("_", "-").toLowerCase();

/** Pay as the drive's role options say it ("₹4-6 LPA"), with the category; an older drive falls back to its CTC text. */
export function payOf(d) {
  const opts = Array.isArray(d.roleOptionsJson) ? d.roleOptionsJson : [];
  const ctcs = opts.map((o) => Number(o?.ctcLpa)).filter((v) => Number.isFinite(v) && v > 0);
  const stipends = opts.map((o) => Number(o?.stipendPerMonth)).filter((v) => Number.isFinite(v) && v > 0);
  const lo = Math.min(...ctcs); const hi = Math.max(...ctcs);
  const fmt = (v) => Number(v.toFixed(2)).toString();
  const text = ctcs.length ? `₹${lo === hi ? fmt(hi) : `${fmt(lo)}-${fmt(hi)}`} LPA`
    : stipends.length ? `₹${Math.max(...stipends).toLocaleString("en-IN")}/month` : d.ctcRange || "";
  const category = d.category || (ctcs.length ? categoryFromCtc(opts) : null);
  return { text, category };
}

/** Where a drive is, beyond Live: taking applications, in rounds, at offers, or wrapping up. */
export function whereItIs(d, c) {
  if (d.lifecycleStatus !== "PUBLISHED") return null;
  if (d.recordedOutside) return "RECORDED";
  // Pipeline counts are authoritative for rounds/offers. Without them, do not guess that a
  // published drive is merely "taking applications" from its deadline alone.
  if (!c) return null;
  const open = !d.applicationDeadline || dj(d.applicationDeadline).isAfter(dj());
  if ((c?.offers || 0) > 0) return "OFFERS";
  if ((c?.roundsDone || 0) > 0 || (!open && (c?.rounds || 0) > 0)) return "ROUNDS";
  if (open) return "APPLICATIONS";
  return "CLOSED_APPS";
}
const WHERE = { APPLICATIONS: "Taking applications", CLOSED_APPS: "Applications closed", ROUNDS: "Rounds", OFFERS: "Offers", RECORDED: "Recorded from outside" };

/** The Drives filter side panel (filters/filterModel); options not listed come from the drives themselves. */
/** The Drives filter side panel, in sections: the drive, its timing, its pay, and the people (owner, applicants). */
const batchIdsOf = (d) => {
  const e = d.eligibilityJson && typeof d.eligibilityJson === "object" ? d.eligibilityJson : {};
  return Array.isArray(e.batchIds) ? e.batchIds.map(String) : [];
};
/** When applications close, as the placement cell thinks of it. */
const closes = (d) => {
  if (!d.applicationDeadline) return d.recordedOutside ? "OUTSIDE" : "NONE";
  const at = dj(d.applicationDeadline);
  if (at.isBefore(dj())) return "PASSED";
  if (at.isBefore(dj().endOf("day"))) return "TODAY";
  if (at.isBefore(dj().add(7, "day"))) return "WEEK";
  return "LATER";
};
const CLOSES = [["TODAY", "Today"], ["WEEK", "In the next 7 days"], ["LATER", "Later"], ["PASSED", "Already closed"], ["NONE", "No deadline set"], ["OUTSIDE", "Happened outside"]];

function driveFilterDefs(driveCounts, batches, ownerName, drives, countsComplete) {
  // Only batches some drive targets (a finished batch nobody targets is not a useful choice).
  const targeted = new Set((drives || []).flatMap(batchIdsOf));
  return [
    { group: "Drive", key: "company", label: "Company", type: "checklist", get: (d) => d.companyName || "Company not set" },
    // Drives target batches (eligibility); an empty list means every batch in placements.
    { group: "Drive", key: "batch", label: "Batch", type: "checklist", get: (d) => (batchIdsOf(d).length ? batchIdsOf(d) : ["ALL"]),
      options: [{ value: "ALL", label: "Every batch in placements" }, ...batches.filter((b) => targeted.has(String(b.batchId))).map((b) => ({ value: String(b.batchId), label: b.name }))] },
    { group: "Timing", key: "where", label: "Where it is", type: "checklist",
      get: (d) => (d.lifecycleStatus === "PUBLISHED" ? whereItIs(d, driveCounts[d.id]) || "UNKNOWN" : "NOT_LIVE"),
      options: [...Object.entries(WHERE).map(([value, label]) => ({ value, label })), { value: "UNKNOWN", label: "Status unavailable" }, { value: "NOT_LIVE", label: "Not live" }] },
    { group: "Timing", key: "closes", label: "Applications close", type: "checklist", get: closes, options: CLOSES.map(([value, label]) => ({ value, label })) },
    { group: "Drive", key: "mode", label: "Mode", type: "checklist", get: (d) => d.driveMode, options: Object.entries(MODE).map(([value, label]) => ({ value, label })) },
    { group: "Drive", key: "type", label: "Job type", type: "checklist", get: (d) => d.jobType || "Not set" },
    { group: "Pay", key: "category", label: "Pay category", type: "checklist", get: (d) => (payOf(d).category ? CATEGORY(payOf(d).category) : "Pay not set") },
    ...(countsComplete ? [{ group: "Pay", key: "offers", label: "Offers made", type: "yesno", get: (d) => Number(driveCounts[d.id]?.offers) > 0, yes: "Has offers", no: "No offers yet" }] : []),
    { group: "Drive", key: "outside", label: "Recorded from outside", type: "yesno", get: (d) => Boolean(d.recordedOutside) },
    // Who runs the drive: the TPO admin who owns it.
    { group: "People", key: "owner", label: "Owner", type: "checklist", get: (d) => (d.ownerFacultyId ? String(d.ownerFacultyId) : "NONE"),
      format: (v) => (v === "NONE" ? "No owner" : ownerName(v)) },
    ...(countsComplete ? [{ group: "People", key: "applied", label: "Students applied", type: "range", get: (d) => driveCounts[d.id]?.applied, min: 0 }] : []),
  ];
}

// The work on the drives, as links (docs/tpo-ux/BEST-VERSION-PROGRAMME-2026-10-05.md). The tabs are separate groups, not a funnel,
// so there is no strip of steps here: one row of links, each a filter on the Live tab (or the Requests tab), highlighted when picked.
const WORK = [
  { key: "requests", label: "Waiting for your review", tab: "requests" },
  { key: "nodeadline", label: "Live with no deadline", filter: { closes: ["NONE"] } },
  { key: "soon", label: "Close in the next 7 days", filter: { closes: ["TODAY", "WEEK"] } },
  { key: "passed", label: "Deadline passed, still open", filter: { closes: ["PASSED"] } },
  { key: "noapplicants", label: "Nobody has applied", filter: { applied: { max: 0 } } },
];
const sameFilter = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Drives list (TPO V1 - Locked.docx §4): tabs with counts, opening on Requests when any wait, otherwise Live. */
export default function TpoDrivesList() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [drives, setDrives] = useState([]);
  const filterDefsRef = useRef([]);
  const [driveCounts, setDriveCounts] = useState({});
  const [countsReady, setCountsReady] = useState(false);
  const [countsError, setCountsError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { dispatch(appAction.setActiveMenuItem("drives")); }, [dispatch]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [res, cnt] = await Promise.all([fetchWithErrorHandling(listDrives()), fetchWithErrorHandling(getDriveCounts())]);
    setLoading(false);
    // Counts are extra, but they decide pipeline stage and "nobody applied" work. Preserve the last
    // verified snapshot on refresh failure and make an initial failure explicitly unknown.
    if (cnt.success && Array.isArray(cnt.data)) {
      setDriveCounts(Object.fromEntries(cnt.data.map((row) => [row.jobId, row])));
      setCountsReady(true);
      setCountsError(null);
    } else {
      setCountsError(cnt?.data?.message || cnt?.data?.error || "Could not load applicant and pipeline counts");
    }
    if (!res.success) { setError(res?.data?.message || res?.data?.error || "Could not load drives"); return; }
    setError(null);
    setDrives(Array.isArray(res.data) ? res.data : []);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  // No season: every drive of the college is listed (batches replaced seasons).
  const inSeason = drives;
  const counts = useMemo(() => Object.fromEntries(Object.entries(TABS).map(([k, t]) => [k, inSeason.filter(t.test).length])), [inSeason]);
  const portfolio = useMemo(() => {
    const now = dj();
    const soon = now.add(7, "day");
    const companyNames = new Set(inSeason.map((d) => d.companyName).filter(Boolean));
    const deadlinesSoon = inSeason.filter((d) => d.lifecycleStatus === "PUBLISHED" && d.applicationDeadline && dj(d.applicationDeadline).isAfter(now) && dj(d.applicationDeadline).isBefore(soon)).length;
    const modes = {
      ON_CAMPUS: inSeason.filter((d) => d.driveMode === "ON_CAMPUS").length,
      POOL: inSeason.filter((d) => d.driveMode === "POOL").length,
      OFF_CAMPUS: inSeason.filter((d) => d.driveMode === "OFF_CAMPUS").length,
    };
    const noDeadline = inSeason.filter((d) => d.lifecycleStatus === "PUBLISHED" && !d.applicationDeadline && !d.recordedOutside).length;
    return { total: inSeason.length, companies: companyNames.size, deadlinesSoon, noDeadline, modes };
  }, [inSeason]);
  const setTab = (key) => router.replace({ pathname: router.pathname, query: { ...router.query, tab: key } }, undefined, { shallow: true });
  // One address change: the Live tab with these filters (two replaces in a row would drop the first).
  const liveFiltered = (f) => router.replace({ pathname: router.pathname, query: { ...mergeQuery(router.query, filterDefsRef.current, f), tab: "live" } }, undefined, { shallow: true });
  const requested = typeof router.query.tab === "string" && TABS[router.query.tab] ? router.query.tab : null;
  const tab = requested || (counts.requests > 0 ? "requests" : "live");
  const rows = inSeason.filter(TABS[tab].test);
  const [batches, setBatches] = useState([]);
  const [batchesError, setBatchesError] = useState(null);
  const loadBatches = useCallback(async () => {
    const r = await fetchWithErrorHandling(getBatches());
    if (!r.success) { setBatchesError(r?.data?.message || r?.data?.error || "Could not load batch names"); return; }
    setBatchesError(null);
    setBatches(r.data?.batches || []);
  }, []);
  useEffect(() => { loadBatches(); }, [loadBatches]);
  // Owner names from the placement team directory (if it can't be read, owners show as "You" / "Someone else").
  const loginUser = useSelector((st) => st.loginUser);
  const [team, setTeam] = useState({});
  const [teamError, setTeamError] = useState(null);
  const loadTeam = useCallback(async () => {
    const r = await fetchWithErrorHandling(getTeam());
    if (!r.success) { setTeamError(r?.data?.message || r?.data?.error || "Could not load drive owner names"); return; }
    const members = Array.isArray(r.data?.members) ? r.data.members : [];
    setTeamError(null);
    setTeam(Object.fromEntries(members.map((t) => [String(t.facultyId), `${t.firstName || ""} ${t.lastName || ""}`.trim()])));
  }, []);
  useEffect(() => { loadTeam(); }, [loadTeam]);
  const ownerName = useCallback((id) => (String(id) === String(loginUser?.id) ? "You" : team[String(id)] || "Someone else"), [team, loginUser?.id]);
  const countsComplete = useMemo(() => countsReady && drives.every((d) => Boolean(driveCounts[d.id])), [countsReady, driveCounts, drives]);
  const filterDefs = useMemo(() => driveFilterDefs(driveCounts, batches, ownerName, drives, countsComplete), [driveCounts, batches, ownerName, drives, countsComplete]);
  // A column that says the same on every drive (every one "On campus", nobody owns a drive) starts hidden; Columns brings it back.
  const same = (get) => rows.length > 1 && new Set(rows.map(get)).size === 1;
  const anyOwner = rows.some((d) => d.ownerFacultyId);
  const [filters, setFilters] = useUrlFilters(filterDefs);
  filterDefsRef.current = filterDefs;
  const [acting, setActing] = useState(null);
  const [startBulk, bulkElement] = useBulkAction();

  // The work links: how many drives each holds (on Live), and which one is picked (from the filters, so a shared link shows it).
  const live = inSeason.filter(TABS.live.test);
  const workCount = (w) => {
    if (w.key === "noapplicants" && !countsComplete) return null;
    return w.tab ? counts[w.tab] : live.filter((d) => Object.entries(w.filter).every(([k, v]) => {
    const def = filterDefs.find((x) => x.key === k);
    if (!def) return false;
    const got = def.get(d);
    if (Array.isArray(v)) return v.includes(String(got));
    return (v.max == null || Number(got) <= v.max) && (v.min == null || Number(got) >= v.min);
  })).length;
  };
  const pickedWork = tab === "requests" ? "requests" : WORK.find((w) => w.filter && Object.keys(filters).length === Object.keys(w.filter).length
    && Object.entries(w.filter).every(([k, v]) => sameFilter(filters[k], v)))?.key;
  const pickWork = (w) => {
    if (w.tab) { setTab(pickedWork === w.key ? "live" : w.tab); return; }
    liveFiltered(pickedWork === w.key ? {} : w.filter);
  };

  // The Actions window for drives.
  const DRIVE = ["drive", "drives"];
  const nameOfDrive = (d) => `${d.companyName || "Company"} · ${d.jobTitle || ""}`;
  const isLive = (d) => (d.lifecycleStatus === "PUBLISHED" ? null : "Not live");
  const passed = (d) => Boolean(d.applicationDeadline) && dj(d.applicationDeadline).isBefore(dj());
  const openOf = (d) => Number(driveCounts[d.id]?.open) || 0;
  const actions = [
    { group: "Live drives", key: "remind", title: "Remind students who haven't applied", help: "Eligible, registered students who haven't applied get an app notification about each drive.",
      // After the deadline they could not apply, so a reminder would only mislead: extend the deadline first.
      skip: (d) => isLive(d) || (d.recordedOutside ? "Recorded from outside" : passed(d) ? "Deadline passed: extend it first" : null),
      run: (list) => startBulk({ title: "Remind students", noun: DRIVE, items: list, nameOf: nameOfDrive, undoNote: "A reminder cannot be taken back.",
        consequence: "Students who already applied are not sent anything.", runEach: (d) => fetchWithErrorHandling(remindNotApplied(d.id)),
        summary: (results) => {
          const n = (results || []).filter((r) => r.ok).reduce((sum, r) => sum + (Number(r.res?.data?.reminded) || 0), 0);
          const none = (results || []).filter((r) => r.ok && Number(r.res?.data?.reminded) === 0).length;
          return `${n.toLocaleString()} student${n === 1 ? "" : "s"} reminded${none ? ` (${none} drive${none === 1 ? " had" : "s had"} nobody left to remind)` : ""}.`;
        },
        onDone: refresh }) },
    { group: "Live drives", key: "extend", title: "Set or extend the deadline", help: "The same new deadline on each drive. A drive whose deadline is already later keeps its own (named in the next step).",
      skip: (d) => isLive(d) || (d.recordedOutside ? "Recorded from outside" : null),
      note: (rows) => {
        const n = rows.filter(passed).length;
        return n ? `${n} of them ${n === 1 ? "has" : "have"} passed ${n === 1 ? "its" : "their"} deadline: a new date opens applications again.` : null;
      },
      fields: <Form.Item name="at" label="New deadline" rules={[{ required: true, message: "Pick the date and time" }]}><DatePicker showTime format="D MMM YYYY, h:mm A" disabledDate={(x) => x && x.isBefore(dj().startOf("day"))} /></Form.Item>,
      run: (list, v) => startBulk({ title: "Set the deadline", noun: DRIVE, items: list, nameOf: nameOfDrive,
        skip: (d) => (d.applicationDeadline && !v.at.isAfter(dj(d.applicationDeadline)) ? "Its deadline is already later" : null),
        consequence: `Applications close on ${v.at.format("D MMM YYYY, h:mm A")}. Students see the new date.${list.some(passed) ? ` Applications open again on ${list.filter(passed).length === 1 ? "the drive" : `the ${list.filter(passed).length} drives`} whose deadline had passed.` : ""}`, undoNote: "Move it again from the drive if needed.",
        runEach: (d) => fetchWithErrorHandling(extendDeadline(d.id, serverTime(v.at))), onDone: refresh }) },
    { group: "Live drives", key: "close", title: "Close", danger: true, help: "Open applicants become Not selected and are told. The waitlist ends. This cannot be undone.",
      // Only a drive whose deadline has passed: no deadline means it is still taking applications.
      skip: (d) => isLive(d) || (!d.applicationDeadline ? "No deadline: still taking applications" : dj(d.applicationDeadline).isAfter(dj()) ? "Still taking applications" : null),
      run: (list) => startBulk({ title: "Close drives", noun: DRIVE, items: list, nameOf: nameOfDrive, danger: true,
        ack: "I understand open applicants become Not selected and are told. This cannot be undone.",
        consequence: (() => {
          // Counts come from the list's extra call; without them, say it plainly instead of "nobody".
          if (!list.some((d) => driveCounts[d.id]?.open !== undefined)) return "Open applicants of each drive become Not selected and are told.";
          const n = list.reduce((sum, d) => sum + openOf(d), 0);
          const each = list.filter((d) => openOf(d) > 0).slice(0, 5).map((d) => `${d.companyName}: ${openOf(d)}`).join(", ");
          return n ? `${n.toLocaleString()} open applicant${n === 1 ? "" : "s"} become Not selected and are told (${each}${list.filter((d) => openOf(d) > 0).length > 5 ? ", and more" : ""}).`
            : "No open applicants: nobody is told anything.";
        })(),
        undoNote: "Closing a drive cannot be undone.",
        runEach: (d) => fetchWithErrorHandling(closeDrive(d.id)), onDone: refresh }) },
  ];
  const narrowedBy = activeCount(filterDefs, filters);
  const act = (shown, selected, clear) => {
    const audience = selected.length ? selected : shown;
    return (
      <>
        <span className="tpo-elig__act-text">
          {selected.length ? <><strong>{selected.length}</strong> selected of {shown.length}</> : <><strong>{shown.length}</strong> {shown.length === 1 ? "drive" : "drives"} in this view</>}
        </span>
        <Button type={selected.length ? "primary" : "default"} icon={<ThunderboltOutlined />} style={audience.length === 0 ? { display: "none" } : undefined} disabled={audience.length === 0} data-testid="drives.act"
          onClick={() => setActing({ audience, selected: selected.length > 0, clear })}>
          {selected.length ? `Act on ${selected.length} selected` : `Act on all ${shown.length}`}
        </Button>
      </>
    );
  };

  const columns = [
    {
      title: "Drive",
      key: "drive",
      exportValue: (r) => `${r.companyName || ""} · ${r.jobTitle || ""}`,
      render: (_, r) => (
        <button type="button" className="tpo-drives__drive-link" onClick={() => router.push(`/tpo/drives/${r.id}`)}>
          <span className="tpo-drives__company">{r.companyName || "Unnamed company"}</span>
          <span className="tpo-drives__role">{r.jobTitle || "Role not specified"}{r.recordedOutside ? " · recorded" : ""}</span>
        </button>
      ),
    },
    tab === "live" && {
      title: "Where it is", key: "where", headerFilterKey: "where", exportValue: (r) => WHERE[whereItIs(r, driveCounts[r.id])] || "",
      render: (_, r) => {
        const w = whereItIs(r, driveCounts[r.id]); const c = driveCounts[r.id] || {};
        const next = c.nextRound ? `${c.nextRound}${c.nextRoundAt ? ` · ${dj(c.nextRoundAt).format("D MMM")}` : ""}` : null;
        return (
          <span className="tpo-drives__where">
            <span>{WHERE[w] || "-"}</span>
            {w === "ROUNDS" && <Typography.Text type="secondary">{c.roundsDone || 0} of {c.rounds || 0} done{next ? ` · next: ${next}` : ""}</Typography.Text>}
            {w === "APPLICATIONS" && next && <Typography.Text type="secondary">First: {next}</Typography.Text>}
          </span>
        );
      },
    },
    { title: "Mode", dataIndex: "driveMode", key: "mode", headerFilterKey: "mode", defaultHidden: true, render: (v) => MODE[v] || v || "-" },
    { title: "Owner", key: "owner", headerFilterKey: "owner", defaultHidden: !anyOwner, exportValue: (r) => (r.ownerFacultyId ? ownerName(r.ownerFacultyId) : ""),
      render: (_, r) => (r.ownerFacultyId ? ownerName(r.ownerFacultyId) : <Typography.Text type="secondary">-</Typography.Text>) },
    { title: "Job type", dataIndex: "jobType", key: "jobType", headerFilterKey: "type", defaultHidden: same((d) => d.jobType),
      render: (v) => v || <Typography.Text type="warning">Not chosen</Typography.Text> },
    {
      title: "Pay", key: "pay", defaultHidden: !rows.some((d) => payOf(d).text || payOf(d).category), exportValue: (r) => [payOf(r).text, payOf(r).category && CATEGORY(payOf(r).category)].filter(Boolean).join(" · "),
      render: (_, r) => {
        const pay = payOf(r);
        return pay.text || pay.category ? (
          <span>{pay.text}{pay.category && <Tag className="tpo-drives__type-tag">{CATEGORY(pay.category)}</Tag>}</span>
        ) : <Typography.Text type="secondary">Not set</Typography.Text>;
      },
    },
    {
      title: "Applied", key: "applied", responsive: ["sm"], align: "right",
      sorter: (a, b) => (driveCounts[a.id]?.applied ?? Number.POSITIVE_INFINITY) - (driveCounts[b.id]?.applied ?? Number.POSITIVE_INFINITY),
      exportValue: (r) => driveCounts[r.id]?.applied ?? "",
      render: (_, r) => {
        const c = driveCounts[r.id];
        if (!c) return <Typography.Text type="secondary">Unavailable</Typography.Text>;
        return (
          <span>
            {/* "1 registered of 50 eligible": registered is the drive page's "Registered and eligible" (who can apply). */}
            {c.applied} applied{c.eligible !== undefined && (
              <Typography.Text type="secondary">
                {" · "}{c.registeredEligible !== undefined ? `${c.registeredEligible} registered of ${c.eligible} eligible` : `${c.eligible} meet the rules`}
              </Typography.Text>
            )}
            {c.offers > 0 && <Typography.Text type="secondary"> · {c.offers} offer{c.offers === 1 ? "" : "s"}</Typography.Text>}
          </span>
        );
      },
    },
    { title: "Deadline", dataIndex: "applicationDeadline", key: "deadline", responsive: ["sm"],
      sorter: (a, b) => (a.applicationDeadline ? dj(a.applicationDeadline).valueOf() : Infinity) - (b.applicationDeadline ? dj(b.applicationDeadline).valueOf() : Infinity),
      render: (v, r) => (v ? dj(v).format("D MMM") : r.recordedOutside ? <Typography.Text type="secondary">Happened outside</Typography.Text> : (
        <Typography.Text type="secondary">{r.lifecycleStatus === "PUBLISHED" ? "No deadline" : "Not set"}</Typography.Text>
      )), exportValue: (r) => (r.applicationDeadline ? dj(r.applicationDeadline).format("D MMM YYYY, h:mm A") : "") },
    ["requests", "closed"].includes(tab) && {
      title: "Status", dataIndex: "lifecycleStatus", key: "status", exportValue: (r) => (STATUS_TAG[r.lifecycleStatus] || [r.lifecycleStatus])[0],
      render: (v) => <Tag className="tpo-drives__status-tag" color={(STATUS_TAG[v] || [])[1]}>{(STATUS_TAG[v] || [v])[0]}</Tag>,
    },
    {
      title: "", key: "open", width: 60,
      render: (_, r) => (
        <span className="tpo-drives__row-actions">
          <Dropdown trigger={["click"]} menu={{ items: [
            { key: "applicants", label: "Applicants", onClick: () => router.push(`/tpo/drives/${r.id}?tab=applicants`) },
            { key: "rounds", label: "Rounds and schedule", onClick: () => router.push(`/tpo/drives/${r.id}?tab=rounds`) },
            { key: "offers", label: "Offers", onClick: () => router.push(`/tpo/drives/${r.id}?tab=offers`) },
          ] }}>
            <Button type="text" size="small" aria-label={`More for ${r.companyName || "this drive"}`} icon={<EllipsisOutlined />} />
          </Dropdown>
        </span>
      ),
    },
  ].filter(Boolean);

  return (
    <div className="scroll-container tpo-drives" data-testid="tpo.drives">
      <PageShell>
        <ListingPageHeader
          className="tpo-drives__header"
          title="Drives"
          subtitle={<Typography.Text type="secondary">Review requests, prepare drafts and run every placement drive from one workspace.</Typography.Text>}
          rightContent={<Button className="tpo-drives__create" type="primary" icon={<PlusOutlined />} onClick={() => router.push("/tpo/drives/new")}>Create drive</Button>}
        />

        {(countsError || batchesError || teamError) && (
          <Alert
            className="tpo-drives__partial-alert"
            type="warning"
            showIcon
            message="Some drive data could not be verified"
            description={[
              countsError ? (countsReady ? "Applicant and pipeline counts are from the last successful refresh." : "Applicant and pipeline counts are unavailable; count-dependent filters and shortcuts are hidden.") : null,
              batchesError ? "Batch names are unavailable, so batch filters may be incomplete." : null,
              teamError ? "Drive owner names are unavailable." : null,
            ].filter(Boolean).join(" ")}
            action={<Button size="small" onClick={() => { if (countsError) refresh(); if (batchesError) loadBatches(); if (teamError) loadTeam(); }}>Retry missing data</Button>}
          />
        )}

        <div className="tpo-journey__extras tpo-drives__work" role="group" aria-label="Needs doing" data-testid="drives.work">
          <span className="tpo-drives__work-label">Needs doing:</span>
          {WORK.map((w) => ({ ...w, n: workCount(w) })).filter((w) => w.n > 0 || pickedWork === w.key).map((w) => (
            <button type="button" key={w.key} className={`tpo-journey__extra${pickedWork === w.key ? " is-on" : ""}`} aria-pressed={pickedWork === w.key}
              onClick={() => pickWork(w)} data-testid={`drives.work.${w.key}`}>
              {w.label} · <strong>{w.n}</strong>
            </button>
          ))}
          {WORK.filter((w) => w.key !== "noapplicants" || countsComplete).every((w) => workCount(w) === 0)
            && <Typography.Text type="secondary">{countsComplete ? "Nothing right now." : "No verified request or deadline work. Applicant counts are unavailable."}</Typography.Text>}
        </div>

        {error && drives.length === 0 ? (
          <PanelError title={error} onRetry={refresh} />
        ) : (
          <Card className="tpo-drives__workspace">
            {error && <Alert className="tpo-drives__stale-alert" type="error" showIcon closable message="This refresh failed. Drives below are from the last successful load." description={error} action={<Button size="small" onClick={refresh}>Retry</Button>} />}

            <Tabs
              className="tpo-drives__tabs"
              activeKey={tab}
              onChange={(k) => router.replace({ pathname: router.pathname, query: { ...router.query, tab: k } }, undefined, { shallow: true })}
              items={Object.entries(TABS).map(([key, t]) => ({
                key,
                label: (
                  <span className="tpo-drives__tab-label">
                    <span>{t.label}</span>
                    <span className={`tpo-drives__tab-count ${key === "requests" && counts[key] > 0 ? "tpo-drives__tab-count--attention" : ""} ${counts[key] === 0 ? "is-zero" : ""}`}>{counts[key]}</span>
                  </span>
                ),
              }))}
            />

            <div className="tpo-drives__table">
              <TpoDataTable
                data={rows}
                rowKey="id"
                columns={columns}
                loading={loading}
                exportName={`drives-${tab}`}
                searchOf={(d) => `${d.companyName} ${d.jobTitle}`}
                viewScope="DRIVES"
                filterDefs={filterDefs}
                filterState={filters}
                onFilterChange={setFilters}
                filterTitle="Filter drives"
                act={act}
                counts={() => null}
                emptyTitle={tab === "requests" ? "No drive requests waiting" : `No ${TABS[tab].label.toLowerCase()} drives yet`}
                emptySubtitle={tab === "requests" ? "New recruiter requests will appear here when they need your review." : "Create a drive when you're ready, or switch to another lifecycle tab."}
                emptyCtaLabel="Create drive"
                onEmptyCta={() => router.push("/tpo/drives/new")}
              />
            </div>
          </Card>
        )}
      </PageShell>
      <ActionsWindow testid="drive-actions" open={Boolean(acting)} onClose={() => setActing(null)} audience={acting?.audience || []} selected={Boolean(acting?.selected)}
        noun={["drive", "drives"]} actions={actions} />
      {bulkElement}
    </div>
  );
}
