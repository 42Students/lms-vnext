import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Router, { useRouter } from "next/router";
import useUrlFilters from "@/components/tpo/filters/useUrlFilters";
import { applyFilters, mergeQuery } from "@/components/tpo/filters/filterModel";
import { Alert, AutoComplete, Button, Card, Col, DatePicker, Dropdown, Empty, Form, Input, Modal, Row, Segmented, Select, Space, Tabs, Tag, Tooltip, Typography, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import ActionsWindow from "@/components/tpo/ui/ActionsWindow";
import { ThunderboltOutlined } from "@ant-design/icons";
import { dj, serverTime } from "@/components/tpo/dj";
import { recruiterActivity } from "@/components/tpo/ui/recruiterActivity";
import PageShell from "@/components/Common/PageShell";
import { PanelError } from "@/components/Common/PanelStates";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import TpoDataTable from "@/components/tpo/TpoDataTable";
import useBulkAction from "@/components/tpo/bulk/BulkAction";
import ImportPreviewModal from "@/components/tpo/ImportPreviewModal";
import InviteModal from "@/components/tpo/InviteModal";
import { STAGES, StageTag } from "@/components/tpo/recruiterLeadStages";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { addFollowUp, addRecruiterLead, checkRecruiterLead } from "@/api/Services/TpoService";
import { dropAction, dropHint, lockedReason } from "@/components/tpo/ui/recruiterLeadBoardRules";
import useChoices from "@/hooks/useChoices";
import { recruiterLeadSourceLabel } from "@/config/choices";
import { bulkInviteRecruiterLeads, bulkRecruiterLeadOwner, bulkRecruiterLeadStage, getMailStatus, commitRecruiterLeadImport, getCompanies, getRecruiterLeadTable, getTeam, previewRecruiterLeadImport, restoreRecruiterLeads, setCompanyCommunication } from "@/api/Services/TpoHubService";
import { listRecruiterAccess } from "@/api/Services/TpoService";
import AsyncModal from "@/components/tpo/ui/AsyncModal";
import Campaigns, { CampaignComposer } from "@/components/tpo/engage/Campaigns";

const errorText = (res, fallback) => res?.data?.message || res?.data?.error || res?.message || fallback;
const CHIP = { OVERDUE: ["Overdue", "red"], NO_NEXT_STEP: ["No next step", "gold"], QUIET: ["Quiet", "default"], BOUNCED: ["Bounced", "red"], UNVERIFIED: ["Unverified", "orange"] };
const BOARD = ["NEW", "CONTACTED", "INVITED", "JOINED", "DRIVE_PLANNED"];
// An unknown ?view= used to just render nothing meaningful in the Tabs; falls back to Table.
const VIEWS = ["table", "board", "companies", "campaigns"];
/** Follow-up due today or overdue. */
// One definition for the summary strip, Home's link and the filter (they used to differ by a rolling 24 hours).
const isDue = (l) => DUE_NOW.includes(followUpWhen(l));
// "Follow-up due" lives in Next follow-up (Overdue, Today): one filter for one question.
const ATTENTION = [["QUIET", "Gone quiet"], ["NO_NEXT_STEP", "No next step"], ["UNASSIGNED", "Unassigned"]];
const INVITE_LABEL = { NOT_SENT: "Not sent", SENT: "Sent", CLICKED: "Clicked", JOINED: "Joined", BOUNCED: "Bounced" };

/** "Follow-up due" = overdue or today (the same as the summary strip's count). */
const DUE_NOW = ["OVERDUE", "TODAY"];
const FOLLOW_UP = [["OVERDUE", "Overdue"], ["TODAY", "Today"], ["WEEK", "In the next 7 days"], ["LATER", "Later"], ["NONE", "None set"]];
const followUpWhen = (l) => {
  if (l.chips?.includes("OVERDUE")) return "OVERDUE";
  if (!l.nextFollowUp) return "NONE";
  const at = dj(l.nextFollowUp);
  if (at.isBefore(dj().startOf("day"))) return "OVERDUE";
  if (at.isBefore(dj().endOf("day"))) return "TODAY";
  return at.isBefore(dj().add(7, "day")) ? "WEEK" : "LATER";
};
const ACTIVITY = [["WEEK", "In the last 7 days"], ["MONTH", "In the last 30 days"], ["OLDER", "Over 30 days ago"], ["NEVER", "Never"]];
const activityWhen = (l) => {
  if (!l.lastActivityAt) return "NEVER";
  const at = dj(l.lastActivityAt);
  return at.isAfter(dj().subtract(7, "day")) ? "WEEK" : at.isAfter(dj().subtract(30, "day")) ? "MONTH" : "OLDER";
};

const ADDED = [["WEEK", "In the last 7 days"], ["MONTH", "In the last 30 days"], ["OLDER", "Earlier"]];
const addedWhen = (l) => {
  if (!l.createdAt) return "OLDER";
  const at = dj(l.createdAt);
  return at.isAfter(dj().subtract(7, "day")) ? "WEEK" : at.isAfter(dj().subtract(30, "day")) ? "MONTH" : "OLDER";
};
const REACH = [["EMAIL", "Has an email"], ["PHONE", "Has a phone"], ["NONE", "Neither"]];

/** The Engage filter side panel (filters/filterModel), in sections: the pipeline, timing, how to reach them, and the company. */
/**
 * Where someone is with the college (docs/naming: one name per thing): a recruiter lead until invited, then invited, and a recruiter once
 * they joined with a 42LMS login. Their record stays the same row all the way through.
 */
const RECRUITER_STATUS = { LEAD: ["Recruiter lead", "default"], INVITED: ["Invited", "blue"], JOINED: ["Joined", "green"] };
const recruiterStatus = (l) => (l.recruiterId ? "JOINED"
  : l.inviteSentAt || ["SENT", "CLICKED", "BOUNCED"].includes(l.inviteStatus) ? "INVITED" : "LEAD");

function recruiterLeadFilterDefs(owners, sources, companies, sourceList) {
  const P = "Pipeline"; const T = "Timing"; const C = "Contact"; const Co = "Company";
  return [
    { group: P, key: "status", label: "Status", type: "checklist", get: recruiterStatus, options: Object.entries(RECRUITER_STATUS).map(([value, [label]]) => ({ value, label })) },
    { group: P, key: "stage", label: "Stage", type: "checklist", get: (l) => l.stage, options: Object.entries(STAGES).map(([value, [label]]) => ({ value, label })) },
    { group: P, key: "attention", label: "Needs attention", type: "checklist", options: ATTENTION.map(([value, label]) => ({ value, label })),
      get: (l) => [l.chips?.includes("QUIET") && "QUIET", l.chips?.includes("NO_NEXT_STEP") && "NO_NEXT_STEP", !l.ownerId && "UNASSIGNED"].filter(Boolean) },
    { group: P, key: "owner", label: "Owner", type: "checklist", get: (l) => (l.ownerId ? String(l.ownerId) : "none"),
      options: [...owners.map(([value, label]) => ({ value: String(value), label: (label || "").trim() || "Someone" })), { value: "none", label: "Unassigned" }] },
    { group: P, key: "invite", label: "Invite", type: "checklist", get: (l) => l.inviteStatus || "NOT_SENT",
      options: Object.entries(INVITE_LABEL).map(([value, label]) => ({ value, label })) },
    { group: T, key: "followUp", label: "Next follow-up", type: "checklist", get: followUpWhen, options: FOLLOW_UP.map(([value, label]) => ({ value, label })) },
    { group: T, key: "lastActivity", label: "Last activity", type: "checklist", get: activityWhen, options: ACTIVITY.map(([value, label]) => ({ value, label })) },
    { group: T, key: "added", label: "Added", type: "checklist", get: addedWhen, options: ADDED.map(([value, label]) => ({ value, label })) },
    { group: C, key: "reach", label: "Can be reached by", type: "checklist", get: (l) => { const r = [l.email && "EMAIL", l.phone && "PHONE"].filter(Boolean); return r.length ? r : ["NONE"]; },
      options: REACH.map(([value, label]) => ({ value, label })) },
    { group: C, key: "designation", label: "Designation", type: "checklist", get: (l) => (l.designation || "").trim() || "Not given" },
    { group: C, key: "source", label: "Where they came from", type: "checklist", get: (l) => l.source || "MANUAL",
      options: (sourceList || []).filter((s) => s.pickable === false || sources.includes(s.value)).map((s) => ({ value: s.value, label: s.label })) },
    { group: Co, key: "company", label: "Company", type: "checklist", get: (l) => l.companyName || "Company not set",
      options: companies.map((c) => ({ value: c, label: c })) },
    { group: Co, key: "drives", label: "Drives that ran with the company", type: "range", get: (l) => Number(l.drives) || 0, min: 0 },
    { group: Co, key: "hired", label: "Students placed by the company", type: "range", get: (l) => Number(l.studentsHired) || 0, min: 0 },
  ];
}

/** The Companies tab's filters (kept on the tab, not in the address: the recruiter leads table owns those). */
/** Communication status in Engage > Companies (recruiter phase 1, N11). */
const COMMUNICATION = [
  { value: "NOT_CONTACTED", label: "Not contacted" }, { value: "EMAILED", label: "Emailed" }, { value: "REPLIED", label: "Replied" },
  { value: "MEETING_SET", label: "Meeting set" }, { value: "NOT_INTERESTED", label: "Not interested" },
];
const communicationLabel = (v) => (COMMUNICATION.find((o) => o.value === v) || COMMUNICATION[0]).label;

const COMPANY_DEFS = [
  { key: "cComm", label: "Communication", type: "checklist", get: (c) => c.communication || "NOT_CONTACTED", options: COMMUNICATION },
  { key: "cContact", label: "Contact", type: "yesno", get: (c) => (c.people || []).length > 0, yes: "Has someone", no: "Nobody yet" },
  { key: "cDrives", label: "Drives that ran", type: "range", get: (c) => Number(c.drives) || 0, min: 0 },
  { key: "cHired", label: "Students placed", type: "range", get: (c) => Number(c.studentsHired) || 0, min: 0 },
  { key: "cSpelling", label: "Typed more than one way", type: "yesno", get: (c) => (c.alsoTypedAs || []).length > 0, yes: "Yes", no: "No" },
];

/** Views saved before the side panel stored { owner, stage, source, due, quiet, noNextStep, unassigned }; read them the new way. */
function panelFromLegacy(f = {}) {
  const out = {};
  if (f.stage) out.stage = [f.stage];
  if (f.owner) out.owner = [String(f.owner)];
  if (f.source) out.source = [f.source];
  if (f.due) out.followUp = DUE_NOW;
  const attention = [f.quiet && "QUIET", f.noNextStep && "NO_NEXT_STEP", f.unassigned && "UNASSIGNED"].filter(Boolean);
  if (attention.length) out.attention = attention;
  return out;
}
const MANUAL_STAGES = ["NEW", "CONTACTED", "NOT_NOW"];
const PIPELINE_STAGES = ["NEW", "CONTACTED", "INVITED", "JOINED", "DRIVE_PLANNED", "RECRUITED"];
const ago = (v) => (v ? dj(v).fromNow?.() || dj(v).format("D MMM") : "-");

/** Engage (was RecruiterLeads; TPO V1 - Locked.docx §3): Table, Board and Companies over the same data. Stages that are facts are worked out, never typed. */
export default function TpoRecruiterLeadsList() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [recruiterLeads, setRecruiterLeads] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companiesLoaded, setCompaniesLoaded] = useState(false); // the tab shows a number only once it is known
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [companiesError, setCompaniesError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const inlineActionRef = useRef(false);
  const [inlineBusy, setInlineBusy] = useState(false);
  const [addDirty, setAddDirty] = useState(false);
  const [importing, setImporting] = useState(false);
  const [invite, setInvite] = useState(null);
  const [emailLive, setEmailLive] = useState(false);
  const [dragRecruiterLead, setDragRecruiterLead] = useState(null);
  const [overStage, setOverStage] = useState(null);

  useEffect(() => {
    if (!adding || !addDirty || savingRef.current || typeof window === "undefined") return undefined;
    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeRouteChange = () => {
      if (window.confirm("Discard this unsaved recruiter lead?")) return;
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) window.history.pushState(null, "", Router.asPath);
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted to preserve unsaved recruiter lead.";
    };
    window.addEventListener("beforeunload", beforeUnload);
    Router.events.on("routeChangeStart", beforeRouteChange);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      Router.events.off("routeChangeStart", beforeRouteChange);
    };
  }, [adding, addDirty]);


  const [stageModal, setStageModal] = useState(null);
  const [campaign, setCampaign] = useState(null); // { recruiterLeads, clear } while writing an Engage email
  const [campaignsKey, setCampaignsKey] = useState(0);
  const [startBulk, bulkElement] = useBulkAction();
  const RECRUITER_LEAD = ["recruiter", "recruiters"];
  const recruiterLeadName = (l) => [l.name, l.companyName].filter(Boolean).join(" · ");
  // Exact undo for owner and stage changes: every picked recruiter lead goes back to the owner and hand-set stage it had.
  const undoRecruiterLeads = (done) => fetchWithErrorHandling(restoreRecruiterLeads(done.map((l) => ({
    id: l.id, ownerId: l.ownerId || null, manualStage: l.manualStage || null, notNowReason: l.notNowReason || null, notNowUntil: l.notNowUntil || null,
  }))));
  const [form] = Form.useForm();
  const [stageForm] = Form.useForm();
  const requestedView = typeof router.query.view === "string" ? router.query.view : "table";
  const tab = VIEWS.includes(requestedView) ? requestedView : "table";

  useEffect(() => { dispatch(appAction.setActiveMenuItem("recruiters")); }, [dispatch]);
  useEffect(() => { fetchWithErrorHandling(getMailStatus()).then((r) => setEmailLive(Boolean(r.data?.templates?.["recruiter-invite"]))); }, []);
  // SHELL-12: the topbar's +New is context-aware from a company page ("New recruiter lead for Acme"), so
  // the company name it passes here needs to actually land in the form, not just open it empty.
  useEffect(() => {
    if (router.query.add !== "1") return;
    if (router.query.company) form.setFieldsValue({ companyName: router.query.company });
    setAdding(true);
  }, [router.query.add, router.query.company, form]);

  // RecruiterLeads and Companies used to load together with Companies' own failure swallowed entirely -
  // a successful RecruiterLeads response + a failed Companies request silently looked like "Companies (0)".
  // They now have independent error state, and a genuine load failure gets an inline PanelError +
  // Retry instead of only a toast that leaves the page on an empty/stale table.
  const refresh = useCallback(async () => {
    setLoading(true);
    const [l, c] = await Promise.all([fetchWithErrorHandling(getRecruiterLeadTable()), fetchWithErrorHandling(getCompanies())]);
    setLoading(false);
    if (!l.success) { setError(errorText(l, "Could not load recruiters")); return; }
    setError(null);
    setRecruiterLeads(Array.isArray(l.data) ? l.data : []);
    if (!c.success) { setCompaniesError(errorText(c, "Could not load companies")); return; }
    setCompaniesError(null);
    setCompanies(Array.isArray(c.data) ? c.data : []);
    setCompaniesLoaded(true);
  }, []);
  // Owners: you, the college's TPO and college admin accounts, and the placement team (Settings > Team); never the whole faculty list.
  const loginUser = useSelector((st) => st.loginUser);
  useEffect(() => {
    refresh();
    fetchWithErrorHandling(getTeam()).then((r) => {
      const KIND = { TPO: "TPO", COLLEGE_ADMIN: "college admin" };
      const accounts = (r.success && Array.isArray(r.data?.accounts) ? r.data.accounts : [])
        .filter((a) => String(a.facultyId) !== String(loginUser?.id))
        .map((a) => ({ facultyId: a.facultyId, firstName: a.firstName, lastName: `${a.lastName || ""} (${KIND[a.kind] || "account"})`.trim() }));
      const members = (r.success && Array.isArray(r.data?.members) ? r.data.members : [])
        .filter((m) => String(m.facultyId) !== String(loginUser?.id) && !accounts.some((a) => String(a.facultyId) === String(m.facultyId)))
        .map((m) => ({ facultyId: m.facultyId, firstName: m.firstName, lastName: m.lastName }));
      const me = loginUser?.id ? [{ facultyId: loginUser.id, firstName: loginUser.firstName || "You", lastName: loginUser.firstName ? `${loginUser.lastName || ""} (you)`.trim() : "" }] : [];
      setTeam([...me, ...accounts, ...members]);
    });
  }, [refresh, loginUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Recruiters who joined: approvals and access live in Settings > Recruiters; Engage links there.
  const [recruiters, setRecruiters] = useState(null);
  useEffect(() => { fetchWithErrorHandling(listRecruiterAccess()).then((r) => setRecruiters(r.success && Array.isArray(r.data) ? r.data : null)); }, []);

  const owners = useMemo(() => [...new Map(recruiterLeads.filter((l) => l.ownerId).map((l) => [l.ownerId, l.ownerName])).entries()], [recruiterLeads]);
  const sources = useMemo(() => [...new Set(recruiterLeads.map((l) => l.source).filter(Boolean))], [recruiterLeads]);
  const [companyFilters, setCompanyFilters] = useUrlFilters(COMPANY_DEFS);
  const companyNames = useMemo(() => [...new Set(recruiterLeads.map((l) => l.companyName).filter(Boolean))].sort(), [recruiterLeads]);
  const shared = useChoices();
  const filterDefs = useMemo(() => recruiterLeadFilterDefs(owners, sources, companyNames, shared.recruiterLeadSources), [owners, sources, companyNames, shared.recruiterLeadSources]);
  const [filters, setFilters] = useUrlFilters(filterDefs);
  // ?due=1 (from Home) opens the table on follow-ups due.
  useEffect(() => {
    if (router.query.due !== "1") return;
    const query = mergeQuery(router.query, filterDefs, { followUp: DUE_NOW });
    delete query.due;
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [router.query.due]); // eslint-disable-line react-hooks/exhaustive-deps
  // The Board shows the filtered recruiter leads; the table gets them all so the panel's counts are right.
  const rows = useMemo(() => applyFilters(recruiterLeads, filterDefs, filters), [recruiterLeads, filterDefs, filters]);
  const crmStats = useMemo(() => {
    const stageCounts = Object.fromEntries(PIPELINE_STAGES.map((stage) => [stage, recruiterLeads.filter((l) => l.stage === stage).length]));
    return {
      total: recruiterLeads.length,
      companies: companies.length,
      due: recruiterLeads.filter(isDue).length,
      quiet: recruiterLeads.filter((l) => l.chips?.includes("QUIET")).length,
      noNextStep: recruiterLeads.filter((l) => l.chips?.includes("NO_NEXT_STEP")).length,
      unassigned: recruiterLeads.filter((l) => !l.ownerId).length,
      joined: recruiterLeads.filter((l) => Boolean(l.recruiterId)).length,
      active: recruiterLeads.filter((l) => ["CONTACTED", "INVITED", "JOINED", "DRIVE_PLANNED"].includes(l.stage)).length,
      planned: recruiterLeads.filter((l) => l.stage === "DRIVE_PLANNED").length,
      recruited: recruiterLeads.filter((l) => l.stage === "RECRUITED").length,
      studentsHired: companies.reduce((sum, c) => sum + (Number(c.studentsHired) || 0), 0),
      stageCounts,
    };
  }, [recruiterLeads, companies]);
  // One address change for both (two replaces in a row would drop the first).
  const openTableWithFilters = (legacy) => {
    router.replace({ pathname: router.pathname, query: { ...mergeQuery(router.query, filterDefs, panelFromLegacy(legacy)), view: "table" } }, undefined, { shallow: true });
  };
  // What needs doing in outreach (docs/tpo-ux/BEST-VERSION-PROGRAMME-2026-10-05.md): links, each a filter, highlighted only when
  // picked; a second click clears it.
  const WORK = [
    { key: "due", label: "Follow-ups due", legacy: { due: true }, n: crmStats.due },
    { key: "nonext", label: "No next step", legacy: { noNextStep: true }, n: crmStats.noNextStep },
    { key: "quiet", label: "Gone quiet", legacy: { quiet: true }, n: crmStats.quiet },
    { key: "unassigned", label: "Unassigned", legacy: { unassigned: true }, n: crmStats.unassigned },
  ];
  const pickedWork = WORK.find((w) => JSON.stringify(panelFromLegacy(w.legacy)) === JSON.stringify(filters))?.key;
  const pickWork = (w) => (pickedWork === w.key ? openTableWithFilters({}) : openTableWithFilters(w.legacy));

  // The Actions window for recruiter leads: the bulk actions the bar had, each through the bulk engine (preview, result, undo).
  const [acting, setActing] = useState(null);
  const recruiterLeadActions = [
    { group: "Move them along", key: "owner", title: "Assign an owner", help: "Who follows up with them.",
      fields: <Form.Item name="ownerId" label="Owner" rules={[{ required: true, message: "Choose the owner" }]}>
        <Select options={team.map((t) => ({ value: t.facultyId, label: `${t.firstName} ${t.lastName || ""}` }))} placeholder="Choose" /></Form.Item>,
      run: (list, v) => {
        const owner = team.find((t) => t.facultyId === v.ownerId);
        const ownerName = owner ? `${owner.firstName} ${owner.lastName || ""}`.trim() : "them";
        startBulk({ title: `Assign to ${ownerName}`, noun: RECRUITER_LEAD, items: list, nameOf: recruiterLeadName,
          skip: (l) => (Number(l.ownerId) === Number(v.ownerId) ? `Already ${ownerName}'s` : null),
          run: (items) => fetchWithErrorHandling(bulkRecruiterLeadOwner(items.map((l) => l.id), v.ownerId)), undo: undoRecruiterLeads, onDone: () => { acting?.clear?.(); refresh(); } });
      } },
    { group: "Move them along", key: "contacted", title: "Mark contacted", help: "You have reached out to them.",
      skip: (l) => (l.stage === "CONTACTED" ? "Already contacted" : l.stage !== "NEW" ? `Already ${(STAGES[l.stage]?.[0] || l.stage).toLowerCase()}` : null),
      run: (list) => startBulk({ title: "Mark contacted", noun: RECRUITER_LEAD, items: list, nameOf: recruiterLeadName,
        run: (items) => fetchWithErrorHandling(bulkRecruiterLeadStage({ recruiterLeadIds: items.map((l) => l.id), stage: "CONTACTED" })), undo: undoRecruiterLeads, onDone: () => { acting?.clear?.(); refresh(); } }) },
    { group: "Move them along", key: "notnow", title: "Not now", help: "Park them with a reason and a date to look again.", skip: (l) => (["NOT_NOW", "RECRUITED"].includes(l.stage) ? "Already parked or recruited" : null),
      button: (n) => `Choose the reason for ${n}…`, run: (list) => { stageForm.resetFields(); setStageModal({ recruiterLeads: list, clear: acting?.clear }); } },
    { group: "Email them", key: "campaign", title: "Send an email", help: "One email you write, to each of them, with their name and an unsubscribe link.",
      skip: (l) => (l.unsubscribedAt ? "Asked not to be contacted" : !l.email ? "No email on file" : null),
      button: (n) => `Write the email to ${n}…`, run: (list) => setCampaign({ recruiterLeads: list, clear: acting?.clear }) },
    ...(emailLive ? [{ group: "Invite them", key: "email", title: "Invite by email", help: "Each gets an email with their private invite link.",
      skip: (l) => (l.recruiterId ? "Already joined" : l.unsubscribedAt ? "Asked not to be contacted" : !l.email ? "No email on file" : null),
      run: (list) => startBulk({ title: "Invite by email", noun: RECRUITER_LEAD, items: list, nameOf: recruiterLeadName, undoNote: "An email cannot be taken back.",
        run: (items) => fetchWithErrorHandling(bulkInviteRecruiterLeads(items.map((l) => l.id), null)),
        // The server's own counts: a recruiter lead can still be skipped there (joined meanwhile, asked not to be contacted, mail off).
        summary: (res) => {
          const e = Number(res?.data?.emailed) || 0;
          const k = Number(res?.data?.skipped) || 0;
          return `${e} emailed${k ? `; ${k} not sent (joined meanwhile, asked not to be contacted, or the email could not go)` : ""}.`;
        },
        onDone: () => { acting?.clear?.(); refresh(); } }) }] : []),
  ];
  const act = (shown, selected, clear) => {
    const audience = selected.length ? selected : shown;
    return (
      <>
        <span className="tpo-elig__act-text">
          {selected.length ? <><strong>{selected.length}</strong> selected of {shown.length}</> : <><strong>{shown.length}</strong> {shown.length === 1 ? "recruiter" : "recruiters"} in this view</>}
        </span>
        <Button type={selected.length ? "primary" : "default"} icon={<ThunderboltOutlined />} style={audience.length === 0 ? { display: "none" } : undefined} disabled={audience.length === 0} data-testid="recruiter-leads.act"
          onClick={() => setActing({ audience, selected: selected.length > 0, clear })}>
          {selected.length ? `Act on ${selected.length} selected` : `Act on all ${shown.length}`}
        </Button>
      </>
    );
  };

  const runInlineAction = async (call, { success, failure = "That change could not be saved" } = {}) => {
    if (inlineActionRef.current) return false;
    inlineActionRef.current = true;
    setInlineBusy(true);
    try {
      const res = await fetchWithErrorHandling(call);
      if (!res.success) {
        message.error(errorText(res, failure));
        return false;
      }
      if (success) message.success(success);
      await refresh();
      return true;
    } finally {
      inlineActionRef.current = false;
      setInlineBusy(false);
    }
  };

  const requestCloseAdd = () => {
    if (savingRef.current) return;
    if (!addDirty) {
      setAdding(false);
      form.resetFields();
      return;
    }
    Modal.confirm({
      title: "Discard this recruiter lead draft?",
      content: "The contact and follow-up details you entered have not been saved.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => {
        setAddDirty(false);
        form.resetFields();
        setAdding(false);
      },
    });
  };

    const submitAdd = async () => {
    if (savingRef.current) return;
    try {
      const values = await form.validateFields();
      const email = (values.email || "").trim();
      const phone = (values.phone || "").trim();
      savingRef.current = true;
      setSaving(true);
      for (const contact of [email, phone].filter(Boolean)) {
        const existing = await fetchWithErrorHandling(checkRecruiterLead(contact));
        if (existing.success && existing.data?.id) {
          Modal.confirm({ title: "This recruiter already exists", content: `${existing.data.name} is already in your recruiters.`, okText: "Open", onOk: () => router.push(`/tpo/recruiters/${existing.data.id}`) });
          return;
        }
      }
      const res = await fetchWithErrorHandling(addRecruiterLead({
        name: values.name, companyName: values.companyName, designation: values.designation || null,
        emailOrPhone: email || phone, otherContact: email && phone ? phone : null, source: values.source || null,
      }));
      if (!res.success) { message.error(errorText(res, "Could not add the recruiter lead")); return; }
      if (values.followUpAt && res.data?.id) {
        const fu = await fetchWithErrorHandling(addFollowUp(res.data.id, { dueAt: serverTime(values.followUpAt), note: values.followUpNote || null }));
        if (!fu.success) message.warning("Recruiter lead added, but the follow-up could not be saved. Add it from their page.");
      }
      message.success(values.followUpAt ? "Recruiter lead added, with a follow-up on your calendar" : "Recruiter lead added");
      setAddDirty(false);
      setAdding(false);
      form.resetFields();
      void refresh();
    } catch (_) {
      // validation errors stay in the form
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const chips = (l) => <Space size={4} wrap>{l.chips.map((c) => <Tag key={c} color={CHIP[c][1]}>{c === "QUIET" ? `Quiet ${l.quietDays}d` : CHIP[c][0]}</Tag>)}</Space>;
  const inviteStatus = { NOT_SENT: "Not sent", SENT: "Sent", CLICKED: "Clicked", JOINED: "Joined", BOUNCED: "Bounced" };

  const columns = [
    {
      title: "Contact",
      key: "contact",
      exportValue: (l) => l.name || "",
      render: (_, l) => (
        <button type="button" className="tpo-crm__contact-link" onClick={() => router.push(`/tpo/recruiters/${l.id}`)}>
          <span className="tpo-crm__contact-name">{l.name || "Unnamed contact"}</span>
          {l.designation && <span className="tpo-crm__company-name">{l.designation}</span>}
        </button>
      ),
    },
    {
      title: "Status", key: "status", headerFilterKey: "status", exportValue: (l) => RECRUITER_STATUS[recruiterStatus(l)][0],
      render: (_, l) => { const [label, color] = RECRUITER_STATUS[recruiterStatus(l)]; return <Tag color={color} bordered={false} data-testid={`recruiter-status-${l.id}`}>{label}</Tag>; },
    },
    {
      title: "Stage", dataIndex: "stage", key: "stage", render: (v) => <StageTag stage={v} />, exportValue: (l) => STAGES[l.stage]?.[0] || l.stage,
      // New / Contacted / Not now are set by hand (the rest are worked out on the server and stay read only).
      edit: {
        options: [{ value: "NEW", label: "New" }, { value: "CONTACTED", label: "Contacted" }, { value: "NOT_NOW", label: "Not now…" }],
        valueOf: (l) => l.stage, editable: (l) => MANUAL_STAGES.includes(l.stage), hint: "New, Contacted and Not now are set by hand",
        onChange: async (l, stage) => {
          if (stage === "NOT_NOW") { stageForm.resetFields(); setStageModal({ recruiterLeads: [l] }); return; }
          await runInlineAction(bulkRecruiterLeadStage({ recruiterLeadIds: [l.id], stage }), {
            success: `${l.name || "Recruiter"}: ${STAGES[stage]?.[0] || stage}`,
            failure: "Could not change the stage",
          });
        },
      },
    },
    { title: "Company", dataIndex: "companyName", key: "company", render: (v) => v || <Typography.Text type="secondary">Not set</Typography.Text> },
    { title: "Designation", dataIndex: "designation", key: "designation", defaultHidden: true }, // also under the name
    { title: "Email", dataIndex: "email", key: "email", defaultHidden: true },
    { title: "Phone", dataIndex: "phone", key: "phone", defaultHidden: true },
    { title: "Flags", key: "chips", render: (_, l) => chips(l), exportValue: (l) => l.chips.map((c) => (c === "QUIET" ? `Quiet ${l.quietDays}d` : CHIP[c]?.[0] || c)).join("; ") },
    {
      title: "Owner", dataIndex: "ownerName", key: "owner", render: (v) => (v || "").trim() || <Typography.Text type="secondary">Unassigned</Typography.Text>,
      exportValue: (l) => (l.ownerName || "").trim(),
      edit: {
        options: team.map((t) => ({ value: t.facultyId, label: `${t.firstName} ${t.lastName || ""}`.trim() })),
        valueOf: (l) => l.ownerId ?? null, editable: () => team.length > 0,
        onChange: async (l, ownerId) => {
          await runInlineAction(bulkRecruiterLeadOwner([l.id], ownerId), { success: "Owner set", failure: "Could not set the owner" });
        },
      },
    },
    { title: "Last activity", key: "last", sorter: (a, b) => String(a.lastActivityAt || "").localeCompare(String(b.lastActivityAt || "")), responsive: ["lg"], render: (_, l) => (l.lastActivityAt ? `${l.lastActivityType?.toLowerCase()} · ${dj(l.lastActivityAt).format("D MMM")}` : "-"), exportValue: (l) => l.lastActivityAt || "" },
    { title: "Next follow-up", dataIndex: "nextFollowUp", key: "next", sortable: true, responsive: ["sm"], render: (v) => (v ? dj(v).format("D MMM") : "-"), exportValue: (l) => l.nextFollowUp || "" },
    { title: "Invite", dataIndex: "inviteStatus", key: "invite", responsive: ["lg"], render: (v, r) => (v === "JOINED" ? recruiterActivity(r).text : inviteStatus[v]),
      exportValue: (r) => (r.inviteStatus === "JOINED" ? recruiterActivity(r).text : inviteStatus[r.inviteStatus] || "") },
    { title: "Added", dataIndex: "createdAt", key: "added", sortable: true, defaultHidden: true, render: (v) => (v ? dj(v).format("D MMM YYYY") : "-") },
    { title: "Came from", dataIndex: "source", key: "source", responsive: ["xl"], render: (v) => recruiterLeadSourceLabel(shared.recruiterLeadSources, v), exportValue: (l) => recruiterLeadSourceLabel(shared.recruiterLeadSources, l.source) },
    { title: "Company drives", dataIndex: "drives", key: "drives", align: "right", responsive: ["xl"] },
    { title: "Students placed", dataIndex: "studentsHired", key: "hired", align: "right", responsive: ["xl"] },
    { title: "", key: "act", width: 88, render: (_, l) => <Button size="small" disabled={Boolean(l.recruiterId) || Boolean(l.unsubscribedAt)} onClick={() => setInvite(l)}>{l.inviteSentAt ? "Resend" : "Invite"}</Button> },
  ];

  // Dropping a recruiter lead on a column does what that column means: mark contacted, say "not now" (with a reason), start an invite or plan a drive.
  const dropRecruiterLead = async (recruiterLead, toStage) => {
    const action = dropAction(recruiterLead.stage, toStage);
    if (action === "MARK_CONTACTED") {
      await runInlineAction(bulkRecruiterLeadStage({ recruiterLeadIds: [recruiterLead.id], stage: "CONTACTED" }), {
        success: `${recruiterLead.name} marked contacted`,
        failure: "Could not move the recruiter",
      });
    } else if (action === "NOT_NOW") { stageForm.resetFields(); setStageModal({ recruiterLeads: [recruiterLead] }); }
    else if (action === "INVITE") setInvite(recruiterLead);
    else if (action === "CREATE_DRIVE") router.push(`/tpo/drives/new?company=${encodeURIComponent(recruiterLead.companyName || "")}`);
  };

  const moveMenu = (l) => ({
    items: [
      !l.recruiterId && { key: "invite", label: l.unsubscribedAt ? "Invite (asked not to be contacted)" : l.inviteSentAt ? "Resend invite" : "Invite", disabled: Boolean(l.unsubscribedAt), onClick: () => setInvite(l) },
      { key: "drive", label: "Create drive", onClick: () => router.push(`/tpo/drives/new?company=${encodeURIComponent(l.companyName || "")}`) },
      // Contacted is a hand-set step from New only; later stages are worked out from invites, joins and drives.
      l.stage === "NEW" && { key: "contacted", label: "Mark contacted", onClick: async () => {
        await runInlineAction(bulkRecruiterLeadStage({ recruiterLeadIds: [l.id], stage: "CONTACTED" }), {
          success: `${l.name} marked contacted`,
          failure: "Could not mark contacted",
        });
      } },
      !["NOT_NOW", "RECRUITED"].includes(l.stage) && { key: "notnow", label: "Not now…", onClick: () => { stageForm.resetFields(); setStageModal({ recruiterLeads: [l] }); } },
    ].filter(Boolean),
  });

  return (
    <div className="scroll-container tpo-crm" data-testid="tpo.recruiter-leads">
      <PageShell>
        <ListingPageHeader
          className="tpo-crm__header"
          title="Engage"
          subtitle={<Typography.Text type="secondary">Build recruiter relationships, keep follow-ups moving, and turn conversations into drives.</Typography.Text>}
          rightContent={<Space className="tpo-crm__header-actions"><Button onClick={() => setImporting(true)}>Import</Button><Button type="primary" icon={<PlusOutlined />} onClick={() => setAdding(true)}>Add recruiter lead</Button></Space>}
        />

        {crmStats.total > 0 && (
          <div className="tpo-journey__extras tpo-drives__work" role="group" aria-label="Needs doing" data-testid="recruiter-leads.work">
            <span className="tpo-drives__work-label">Needs doing:</span>
            {WORK.filter((w) => w.n > 0 || pickedWork === w.key).map((w) => (
              <button type="button" key={w.key} className={`tpo-journey__extra${pickedWork === w.key ? " is-on" : ""}`} aria-pressed={pickedWork === w.key}
                onClick={() => pickWork(w)} data-testid={`recruiter-leads.work.${w.key}`}>{w.label} · <strong>{w.n}</strong></button>
            ))}
            {WORK.every((w) => !w.n) && <Typography.Text type="secondary">Nothing right now.</Typography.Text>}
            {recruiters && (() => { const n = recruiters.filter((r) => r.status === "ACTIVE" && !r.expired).length; return <Button type="link" size="small" href="/tpo/settings?tab=recruiters">{n} {n === 1 ? "recruiter" : "recruiters"} with access</Button>; })()}
          </div>
        )}
        {error && recruiterLeads.length === 0 ? (
          <PanelError title={error} onRetry={refresh} />
        ) : (
          <>
            {error && <Alert type="error" showIcon closable style={{ marginBottom: 12 }} message="This refresh failed. Recruiters below are from the last successful load." description={error} action={<Button size="small" onClick={refresh}>Retry</Button>} />}
            {companiesError && <Alert type="warning" showIcon closable style={{ marginBottom: 12 }} message="Companies could not be loaded" description={companiesError} action={<Button size="small" onClick={refresh}>Retry</Button>} />}
            <Tabs className="tpo-crm__views" activeKey={tab} onChange={(k) => router.replace({ pathname: router.pathname, query: { ...router.query, view: k } }, undefined, { shallow: true })}
          items={[
            {
              key: "table", label: "Table",
              children: (
                <Card className="tpo-crm__table-card">
                  <TpoDataTable data={recruiterLeads} rowKey="id" columns={columns} loading={loading} exportName="recruiter-leads" viewScope="RECRUITER_LEADS"
                    filterDefs={filterDefs} filterState={filters} onFilterChange={setFilters} filterTitle="Filter recruiters" onApplyFilters={(f) => setFilters(panelFromLegacy(f))}
                    searchOf={(l) => `${l.name} ${l.companyName} ${l.email} ${l.phone}`}
                    emptyTitle="No recruiters yet" emptySubtitle="Add a company contact to start tracking outreach." emptyCtaLabel="Add recruiter lead" onEmptyCta={() => setAdding(true)}
                    act={act} counts={() => null} />
                </Card>
              ),
            },
            {
              key: "board", label: "Board",
              children: (
                <>
                {rows.length !== recruiterLeads.length && (
                  <Alert type="info" showIcon className="tpo-crm__board-filtered" message={`Showing ${rows.length} of ${recruiterLeads.length} recruiters (filters from the Table view)`}
                    action={<Button size="small" onClick={() => setFilters({})}>Show all</Button>} />
                )}
                <div className="tpo-crm__board-scroll"><Row className="tpo-crm__board" gutter={[12, 12]} wrap={false}>
                  {[...BOARD, "RECRUITED", "NOT_NOW"].map((stage) => {
                    const col = rows.filter((l) => l.stage === stage);
                    const collapsed = stage === "RECRUITED" || stage === "NOT_NOW";
                    return (
                      // All seven stages share the width (min 140px), so the board fits a laptop screen; narrower screens scroll.
                      <Col key={stage} flex="1 1 0" style={{ minWidth: 140 }}>
                        <Card
                          className={`tpo-crm__board-column${dragRecruiterLead && dropAction(dragRecruiterLead.stage, stage) ? " is-droppable" : ""}${overStage === stage && dragRecruiterLead && dropAction(dragRecruiterLead.stage, stage) ? " is-over" : ""}${dragRecruiterLead && !dropAction(dragRecruiterLead.stage, stage) && dragRecruiterLead.stage !== stage ? " is-locked" : ""}`}
                          size="small" title={<span><StageTag stage={stage} />{col.length}</span>} styles={{ body: { maxHeight: 460, overflowY: "auto" } }}
                          onDragOver={(e) => { if (dragRecruiterLead && dropAction(dragRecruiterLead.stage, stage)) { e.preventDefault(); setOverStage(stage); } }}
                          onDragLeave={() => setOverStage(null)}
                          onDrop={(e) => { e.preventDefault(); const l = dragRecruiterLead; setDragRecruiterLead(null); setOverStage(null); if (l) dropRecruiterLead(l, stage); }}
                        >
                          {dragRecruiterLead && dragRecruiterLead.stage !== stage && (
                            <Typography.Text className="tpo-crm__drop-hint" type="secondary">{dropAction(dragRecruiterLead.stage, stage) ? dropHint(dropAction(dragRecruiterLead.stage, stage)) : lockedReason(stage) || "Set automatically"}</Typography.Text>
                          )}
                          {col.length === 0 && !dragRecruiterLead && <Typography.Text type="secondary">Empty</Typography.Text>}
                          {col.slice(0, collapsed ? 5 : 50).map((l) => (
                            <Card className="tpo-crm__lead-card" key={l.id} size="small" style={{ marginBottom: 8 }} hoverable draggable={stage !== "RECRUITED"}
                              onDragStart={() => setDragRecruiterLead(l)} onDragEnd={() => { setDragRecruiterLead(null); setOverStage(null); }}>
                              <a onClick={() => router.push(`/tpo/recruiters/${l.id}`)}><b>{l.name}</b></a>
                              <div>{l.companyName}</div>
                              <Typography.Text type="secondary" style={{ fontSize: 12 }}>{l.lastActivityAt ? `${l.lastActivityType?.toLowerCase()} · ${dj(l.lastActivityAt).format("D MMM")}` : "No activity"}{l.nextFollowUp ? ` · next ${dj(l.nextFollowUp).format("D MMM")}` : ""}</Typography.Text>
                              <div style={{ marginTop: 4 }}>{chips(l)}</div>
                              <Dropdown menu={moveMenu(l)} trigger={["click"]}><Button size="small" type="link" style={{ paddingLeft: 0 }}>Move to…</Button></Dropdown>
                            </Card>
                          ))}
                          {collapsed && col.length > 5 && <Typography.Text type="secondary">+ {col.length - 5} more in the Table view</Typography.Text>}
                        </Card>
                      </Col>
                    );
                  })}
                </Row></div>
                </>
              ),
            },
            {
              key: "companies", label: companiesLoaded ? `Companies (${companies.length})` : "Companies",
              children: (
                <Card className="tpo-crm__companies-card">
                  <TpoDataTable data={companies} rowKey="key" exportName="companies" searchOf={(c) => `${c.name} ${(c.people || []).map((p) => p.name).join(" ")}`}
                    filterDefs={COMPANY_DEFS} filterState={companyFilters} onFilterChange={setCompanyFilters} filterTitle="Filter companies"
                    emptyTitle="No companies yet" emptySubtitle="Companies appear here once you have a recruiter or a drive with them."
                    columns={[
                      { title: "Company", dataIndex: "name", key: "name", render: (v, c) => (
                        <span>
                          <a onClick={() => router.push(`/tpo/companies?name=${encodeURIComponent(v)}`)}>{v}</a>
                          {(c.alsoTypedAs || []).length > 0 && <Tooltip title={`Also typed as ${c.alsoTypedAs.join(", ")}. Counted as one company.`}><Typography.Text type="secondary" className="tpo-crm__spellings"> · also {c.alsoTypedAs.length} other spelling{c.alsoTypedAs.length === 1 ? "" : "s"}</Typography.Text></Tooltip>}
                        </span>
                      ) },
                      { title: "People", key: "people", render: (_, c) => (c.people.length ? c.people.map((p) => p.name).join(", ") : <Button type="link" size="small" className="tpo-crm__add-contact" style={{ padding: 0, height: "auto" }} onClick={() => { setAdding(true); setTimeout(() => form.setFieldsValue({ companyName: c.name }), 0); }}>Add a contact</Button>), exportValue: (c) => c.people.map((p) => p.name).join("; ") },
                      { title: "Communication", dataIndex: "communication", key: "communication", width: 170, exportValue: (c) => communicationLabel(c.communication),
                        render: (v, c) => (
                          <Select size="small" value={v || "NOT_CONTACTED"} options={COMMUNICATION} style={{ width: 150 }} aria-label={`Communication with ${c.name}`}
                            onClick={(e) => e.stopPropagation()}
                            onChange={async (next) => {
                              const before = companies;
                              setCompanies((all) => all.map((x) => (x.key === c.key ? { ...x, communication: next, communicationSet: true } : x)));
                              const r = await fetchWithErrorHandling(setCompanyCommunication(c.name, next));
                              if (!r.success) { setCompanies(before); message.error(r?.data?.message || "Couldn't save"); }
                            }} />
                        ) },
                      { title: "Drives that ran", dataIndex: "drives", key: "drives", align: "right" },
                      { title: "Students placed", dataIndex: "studentsHired", key: "hired", align: "right" },
                    ]} />
                </Card>
              ),
            },
            { key: "campaigns", label: "Emails", children: <Campaigns reloadKey={campaignsKey} /> },
          ]} />
          </>
        )}
      </PageShell>

      <CampaignComposer open={Boolean(campaign)} recruiterLeads={campaign?.recruiterLeads} onClose={() => setCampaign(null)}
        onSent={() => { campaign?.clear?.(); setCampaignsKey((k) => k + 1); refresh(); }} />
      <Modal title="Add recruiter lead" open={adding} onCancel={requestCloseAdd} onOk={submitAdd} okText="Add recruiter lead" confirmLoading={saving} destroyOnClose>
        <Form form={form} layout="vertical" className="tpo-form-grid" onValuesChange={(c, all) => {
          setAddDirty(true);
          if (c.email && String(c.email).includes("@") && !all.companyName) {
            const d = String(c.email).split("@")[1] || "";
            const base = d.split(".")[0];
            if (base && !["gmail", "yahoo", "outlook", "hotmail", "rediffmail", "icloud"].includes(base.toLowerCase()) && d.includes(".")) form.setFieldsValue({ companyName: base.charAt(0).toUpperCase() + base.slice(1) });
          }
        }}>
          <div className="tpo-form-row">
            <Form.Item name="name" label="Name" rules={[{ required: true, whitespace: true, message: "Name is required" }]}><Input placeholder="Ravi Kumar" /></Form.Item>
            <Form.Item name="designation" label="Designation (optional)"><Input placeholder="HR Manager" /></Form.Item>
          </div>
          <div className="tpo-form-row">
            <Form.Item name="email" label="Email" rules={[{ type: "email", message: "Enter a valid email" }, ({ getFieldValue }) => ({ validator: (_, v) => (v || getFieldValue("phone") ? Promise.resolve() : Promise.reject(new Error("Add an email or a phone"))) })]}><Input placeholder="ravi@acme.com" /></Form.Item>
            <Form.Item name="phone" label="Phone" dependencies={["email"]} rules={[{ pattern: /^[+\d][\d\s-]{7,}$/, message: "Enter a valid phone number" }]}><Input placeholder="98xxxxxx01" /></Form.Item>
          </div>
          <Form.Item name="companyName" label="Company" rules={[{ required: true, whitespace: true, message: "Company is required" }]} extra="Filled in from a work email when we can. Pick an existing company so it is not typed a new way.">
            <AutoComplete options={companies.map((c) => ({ value: c.name }))} filterOption={(input, o) => String(o.value).toLowerCase().includes(String(input).toLowerCase())} />
          </Form.Item>
          <Form.Item name="source" label="Where did you find them? (optional)" extra="Shows which channels bring the companies that hire. Left empty, it shows as Added by hand.">
            <Select allowClear placeholder="Alumni, referral, LinkedIn…" options={(shared.recruiterLeadSources || []).filter((s) => s.pickable !== false).map((s) => ({ value: s.value, label: s.label }))} />
          </Form.Item>
          <div className="tpo-form-row">
            <Form.Item name="followUpAt" label="Follow up on (optional)"><DatePicker showTime={{ format: "h:mm A" }} format="D MMM, h:mm A" /></Form.Item>
            <Form.Item name="followUpNote" label="About"><Input placeholder="Share the campus calendar" /></Form.Item>
          </div>
        </Form>
      </Modal>

      {bulkElement}
      <ActionsWindow testid="recruiter-lead-actions" open={Boolean(acting)} onClose={() => setActing(null)} audience={acting?.audience || []} selected={Boolean(acting?.selected)}
        noun={RECRUITER_LEAD} actions={recruiterLeadActions} />
      <AsyncModal title="Not now" open={Boolean(stageModal)} onCancel={() => { if (!inlineActionRef.current) setStageModal(null); }} confirmLoading={inlineBusy} okText="Save" destroyOnClose
        onOk={async () => {
          try {
            const v = await stageForm.validateFields();
            const body = (items) => ({ recruiterLeadIds: items.map((l) => l.id), stage: "NOT_NOW", reason: v.reason, revisitDate: v.revisit ? v.revisit.format("YYYY-MM-DD") : null });
            const { recruiterLeads: picked, clear: clearPicked } = stageModal;
            if (picked.length > 1) {
              setStageModal(null);
              startBulk({ title: "Mark not now", noun: RECRUITER_LEAD, items: picked, nameOf: recruiterLeadName, consequence: `Reason: ${v.reason}`,
                run: (items) => fetchWithErrorHandling(bulkRecruiterLeadStage(body(items))), undo: undoRecruiterLeads, onDone: () => { clearPicked?.(); refresh(); } });
              return;
            }
            const ok = await runInlineAction(bulkRecruiterLeadStage(body(picked)), { failure: "Failed" });
            if (!ok) return;
            clearPicked?.();
            setStageModal(null);
          } catch (_) { /* validation */ }
        }}>
        <Form form={stageForm} layout="vertical">
          <Form.Item name="reason" label="Why not now?" rules={[{ required: true, message: "Say why" }]}><Input /></Form.Item>
          <Form.Item name="revisit" label="Revisit on"><DatePicker /></Form.Item>
        </Form>
      </AsyncModal>

      <InviteModal recruiterLead={invite} onClose={() => setInvite(null)} onCreated={refresh} />

      <ImportPreviewModal open={importing} title="Import recruiter leads" onClose={() => setImporting(false)} allowed={["name", "email", "phone", "company", "designation", "source"]}
        help={`Download the template, fill in one row per person, and upload it. You see how many are new, how many already exist and which need fixing before anything is added. The source column is optional: one of ${(shared.recruiterLeadSources || []).filter((s) => s.pickable !== false).map((s) => s.label).join(", ")}. Left empty, it shows as Imported.`}
        template={{ name: "recruiter-leads-template", headings: ["name", "email", "phone", "company", "designation", "source"], example: ["Ravi Kumar", "ravi@acme.com", "", "Acme", "HR Manager", "Alumni"] }}
        groups={[{ key: "new", label: "New", tone: "green" }, { key: "duplicates", label: "Already recruiters", tone: "default" }, { key: "toFix", label: "To fix", tone: "red" }]}
        matchedColumns={[{ title: "Name", dataIndex: "name" }, { title: "Company", dataIndex: "company" }, { title: "Contact", dataIndex: "contact" }]}
        preview={(r) => previewRecruiterLeadImport(r)} commit={(r) => commitRecruiterLeadImport(r)}
        onDone={(d) => { setImporting(false); message.success(`${d?.created ?? 0} recruiter leads added. Open one to invite them.`); refresh(); }} />
    </div>
  );
}
