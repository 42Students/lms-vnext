import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import Router, { useRouter } from "next/router";
import Link from "next/link";
import {
  Alert, Button, Card, DatePicker, Divider, Dropdown, Form, Input, InputNumber, List, Modal, Popconfirm, Segmented, Select, Skeleton, Space, Switch, Tag, Tooltip, Typography, message,
} from "antd";
import { dj } from "@/components/tpo/dj";
import { normaliseDomain } from "@/components/tpo/ui/domain";
import TpoDataTable from "@/components/tpo/TpoDataTable";
import JobTypesTab from "@/components/tpo/settings/JobTypesTab";
import OutcomeLabelsTab from "@/components/tpo/settings/OutcomeLabelsTab";
import PageShell from "@/components/Common/PageShell";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { PanelError } from "@/components/Common/PanelStates";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import {
  extendRecruiterAccess, getPlacementRules, getWhatCompaniesSee, listRecruiterAccess, revokeRecruiterAccess, savePlacementRules, saveWhatCompaniesSee,
} from "@/api/Services/TpoService";
import {
  getCgpaRule, getCollegeSettings, getMailStatus, getPrepCourses, getSeasonSettings,
  getTeam, saveCgpaRule, saveCollegeSettings, updateSeason,
} from "@/api/Services/TpoHubService";
import AsyncModal from "@/components/tpo/ui/AsyncModal";
import PublicLinkCard from "@/components/tpo/settings/PublicLinkCard";
import PlacementsPageSettings from "@/components/tpo/settings/PlacementsPageSettings";
import TeamPeople from "@/components/tpo/team/TeamPeople";

const errorText = (res, fallback) => res?.data?.message || res?.data?.error || res?.message || fallback;
const useRun = () => {
  const busyRef = useRef(false);
  return useCallback(async (label, call, after) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    try {
      const res = await fetchWithErrorHandling(call);
      if (!res.success) { message.error(errorText(res, `${label} failed`)); return false; }
      message.success(label);
      await after?.(res.data);
      return true;
    } finally {
      busyRef.current = false;
    }
  }, []);
};
const fullName = (x) => `${x?.firstName || ""} ${x?.lastName || ""}`.trim();
const day = (v) => (v ? dj(v).format("D MMM YYYY") : "");

const SETTINGS_META = {
  rules: { eyebrow: "Placement policy", title: "Placement rules", description: "When a student counts as placed, how many offers they can hold and how long they have to answer one. Also how a CGPA becomes a percentage." },
  jobtypes: { eyebrow: "Placement policy", title: "Job types", description: "The job types drives can have, and whether an offer of each counts as placed. Add your own; switch off the ones you never use." },
  outcomes: { eyebrow: "Placement policy", title: "After college", description: "What every student does after college (placed, higher studies, entrepreneurship, competitive exams...) and your own labels for them." },
  prep: { eyebrow: "Placement policy", title: "Prep readiness", description: "The courses that show whether a student is ready to interview. Below your bar, the Students page marks them as needing prep." },
  blocked: { eyebrow: "Placement policy", title: "Blocked dates", description: "Exam weeks and holidays. Scheduling warns you before a drive or round lands on one." },
  team: { eyebrow: "People", title: "Placement team", description: "Who is on your placement team, what each person owns, and who is away. Their conversations are in Messages > Team." },
  recruiters: { eyebrow: "People", title: "Recruiters", description: "Recruiters who can see your college, whether their drive requests need your approval." },
  notices: { eyebrow: "Students and companies", title: "Student notices", description: "Which emails and SMS your students get, and the monthly limit on optional SMS." },
  see: { eyebrow: "Students and companies", title: "What companies see", description: "What a company sees about your students when you share applicants, or when a recruiter opens their own drive." },
  webpage: { eyebrow: "Students and companies", title: "Placements page", description: "Your public placements page: a few lines about your placements, the live numbers you choose, and \"Recruit from us\" for companies." },
  branding: { eyebrow: "Students and companies", title: "Branding", description: "Your logo and the signature at the end of recruiter invites and placement emails." },
};

// Sections, grouped by what the TPO is trying to do. Owner, 19 Oct 2026: only what is needed right now. Prep readiness,
// blocked dates, student notices, what companies see, the placements page and branding are hidden (their panels, saved
// values and defaults stay; put a key back in a group to show it again).
const SETTINGS_GROUPS = [
  { label: "Placement policy", keys: ["rules", "jobtypes", "outcomes"] },
  { label: "People", keys: ["team", "recruiters"] },
];
const HIDDEN = ["prep", "blocked", "notices", "see", "webpage", "branding"];
const NAV_LABEL = { team: "Placement team", rules: "Placement rules", jobtypes: "Job types", outcomes: "After college", prep: "Prep readiness", blocked: "Blocked dates", recruiters: "Recruiters", notices: "Student notices", see: "What companies see", webpage: "Placements page", branding: "Branding" };
// Sections that were merged into others, or hidden for now: old links land on a section that is shown.
const MOVED = { trusted: "recruiters", templates: "recruiters", notifications: "rules", ...Object.fromEntries(HIDDEN.map((k) => [k, "rules"])) };

// A section with unsaved edits tells the page, so leaving it (nav, browser tab) can ask first.
const DirtyContext = createContext({ setDirty: () => {} });
const useDirty = () => useContext(DirtyContext);

/** Settings (TPO V1 - Locked.docx §9). Ten sections in three groups; see docs/tpo-ux/SETTINGS-AUDIT-2-2026-10-05.md. */
// How a recruiter came to have access, for Settings > Recruiters.
const JOINED_VIA = { PUBLIC_LINK: "Public link", COMPANY_LINK: "Company link", INVITE: "Invitation" };

export default function TpoSettings() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const setDirtyTracked = useCallback((value) => {
    const next = Boolean(typeof value === "function" ? value(dirtyRef.current) : value);
    dirtyRef.current = next;
    setDirty(next);
  }, []);
  useEffect(() => { dispatch(appAction.setActiveMenuItem("settings")); }, [dispatch]);
  const [hashTab, setHashTab] = useState(null);
  useEffect(() => { if (typeof window !== "undefined") setHashTab(window.location.hash.replace("#", "") || null); }, [router.asPath]);
  const asked = typeof router.query.tab === "string" ? router.query.tab : (hashTab || "rules");
  const requestedTab = MOVED[asked] || asked;
  const tab = SETTINGS_META[requestedTab] ? requestedTab : "rules";
  const current = SETTINGS_META[tab];

  useEffect(() => {
    if (!dirty || typeof window === "undefined") return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    const beforeRouteChange = () => {
      if (!dirtyRef.current) return;
      if (window.confirm("You have unsaved placement settings. Leave without saving them?")) {
        setDirtyTracked(false);
        return;
      }
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) window.history.pushState(null, "", Router.asPath);
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted to preserve unsaved placement settings.";
    };
    window.addEventListener("beforeunload", warn);
    Router.events.on("routeChangeStart", beforeRouteChange);
    return () => {
      window.removeEventListener("beforeunload", warn);
      Router.events.off("routeChangeStart", beforeRouteChange);
    };
  }, [dirty, setDirtyTracked]);

  const go = (key) => {
    if (key === tab) return;
    const move = () => { setDirtyTracked(false); router.replace({ pathname: router.pathname, query: { tab: key } }, undefined, { shallow: true }); };
    if (!dirtyRef.current) { move(); return; }
    Modal.confirm({ title: "Leave without saving?", content: "You changed something in this section and have not saved it.", okText: "Leave and discard", okButtonProps: { danger: true }, cancelText: "Stay", onOk: move });
  };
  const ctx = useMemo(() => ({ setDirty: setDirtyTracked }), [setDirtyTracked]);
  // Settings belong to TPO admins (anyone else is refused by the server). The team list answers who you are: refused means
  // not an admin. Until it answers, nothing is shown, so nobody sees the admin sections flash.
  const [notAdmin, setNotAdmin] = useState(null);
  const [accessError, setAccessError] = useState(null);
  const [accessRetry, setAccessRetry] = useState(0);
  useEffect(() => {
    setNotAdmin(null);
    setAccessError(null);
    fetchWithErrorHandling(getTeam()).then((r) => {
      if (r.success) {
        setNotAdmin(false);
        return;
      }
      if (Number(r.status) === 403) {
        setNotAdmin(true);
        return;
      }
      // Unknown permission state must never be treated as TPO-admin access.
      setAccessError(errorText(r, "Could not verify your placement-settings access."));
    });
  }, [accessRetry]);
  const PANELS = { jobtypes: <JobTypesTab setDirty={setDirtyTracked} />, outcomes: <OutcomeLabelsTab setDirty={setDirtyTracked} />, prep: <PrepTab />, blocked: <BlockedDatesTab />, rules: <RulesTab />, notices: <NoticesTab />, see: <SeeTab />, webpage: <PlacementsPageSettings />, branding: <BrandingTab />, recruiters: <RecruitersTab />, team: <TeamPeople meId={null} /> };

  if (accessError) {
    return (
      <div className="scroll-container tpo-settings" data-testid="tpo.settings">
        <PageShell>
          <ListingPageHeader className="tpo-settings__header" title="Settings" />
          <PanelError title={accessError} onRetry={() => setAccessRetry((value) => value + 1)} />
        </PageShell>
      </div>
    );
  }

  if (notAdmin) {
    return (
      <div className="scroll-container tpo-settings" data-testid="tpo.settings">
        <PageShell>
          <ListingPageHeader className="tpo-settings__header" title="Settings" />
          <Alert type="info" showIcon message="College settings are managed by the TPO admins." description="Ask a TPO admin if something here needs to change." />
        </PageShell>
      </div>
    );
  }

  return (
    <div className="scroll-container tpo-settings" data-testid="tpo.settings">
      <PageShell>
        <ListingPageHeader
          className="tpo-settings__header"
          title="Settings"
          subtitle={<Typography.Text type="secondary">How your placement cell runs: its rules, its people, and what students and companies get.</Typography.Text>}
        />
        <div className="tpo-settings__layout">
          <nav className="tpo-settings__nav" aria-label="Settings sections">
            {notAdmin === null ? <Skeleton active paragraph={{ rows: 8 }} title={false} /> : SETTINGS_GROUPS.map((g) => (
              <div className="tpo-settings__nav-group" key={g.label}>
                <span className="tpo-settings__nav-label">{g.label}</span>
                {g.keys.map((k) => (
                  <button type="button" key={k} className={`tpo-settings__nav-item${k === tab ? " is-active" : ""}`} aria-current={k === tab ? "page" : undefined} onClick={() => go(k)}>{NAV_LABEL[k]}</button>
                ))}
              </div>
            ))}
          </nav>
          <section className="tpo-settings__panel" aria-label={current.title}>
            <div className="tpo-settings__panel-head">
              <Typography.Title level={3}>{current.title}</Typography.Title>
              <Typography.Paragraph type="secondary">{current.description}</Typography.Paragraph>
              {dirty && <Tag color="orange" className="tpo-settings__unsaved">Unsaved changes</Tag>}
            </div>
            {notAdmin === null ? <Skeleton active /> : <DirtyContext.Provider value={ctx}>{PANELS[tab]}</DirtyContext.Provider>}
          </section>
        </div>
      </PageShell>
    </div>
  );
}

/** Save for a form section: says "Save changes" and is live only when something changed. */
function SaveButton({ dirty, loading, onClick, style }) {
  return <Button type="primary" disabled={!dirty} loading={loading} onClick={onClick} style={style}>Save changes</Button>;
}

// ---------------------------------------------------------------- Blocked dates
// Stored as one entry per day; edited as ranges (an exam week is one row, not seven).
const toRanges = (days) => {
  const sorted = [...days].filter((x) => x?.date).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const out = [];
  for (const d of sorted) {
    const last = out[out.length - 1];
    const label = d.label || "Blocked";
    if (last && last.label === label && dj(d.date).diff(dj(last.to), "day") === 1) last.to = d.date;
    else if (!(last && last.label === label && dj(d.date).isSame(dj(last.to), "day"))) out.push({ from: d.date, to: d.date, label });
  }
  return out;
};
const toDays = (ranges) => {
  const byDate = new Map();
  for (const r of ranges) {
    for (let d = dj(r.from); !d.isAfter(dj(r.to), "day"); d = d.add(1, "day")) byDate.set(d.format("YYYY-MM-DD"), r.label || "Blocked");
  }
  return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, label]) => ({ date, label }));
};

/** Exam weeks and holidays. Stored on the college's one (hidden) season record, which the server creates on first look. */
function BlockedDatesTab() {
  const [record, setRecord] = useState(null);
  const [past, setPast] = useState([]);
  const [showPast, setShowPast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [changed, setChanged] = useState(false);
  const [form] = Form.useForm();
  const run = useRun();
  const { setDirty } = useDirty();
  const load = useCallback(async () => {
    setLoading(true); setError(false);
    const r = await fetchWithErrorHandling(getSeasonSettings());
    setLoading(false);
    if (!r.success) { setError(true); return; }
    const list = Array.isArray(r.data) ? r.data : [];
    const current = list.find((x) => x.isCurrent) || list[0] || null;
    setRecord(current);
    const today = dj().startOf("day");
    const ranges = toRanges(current?.blockedDates || []);
    setPast(ranges.filter((x) => dj(x.to).isBefore(today)));
    form.setFieldsValue({ blocked: ranges.filter((x) => !dj(x.to).isBefore(today)).map((x) => ({ range: [dj(x.from), dj(x.to)], label: x.label })) });
    setChanged(false);
  }, [form]);
  useEffect(() => { load(); }, [load]);
  if (error) return <PanelError title="Couldn't load your blocked dates" onRetry={load} />;

  const save = async () => {
    const v = await form.validateFields();
    if (!record) return;
    const upcoming = (v.blocked || []).filter((x) => x?.range?.[0]).map((x) => ({ from: x.range[0].format("YYYY-MM-DD"), to: x.range[1].format("YYYY-MM-DD"), label: (x.label || "").trim() || "Blocked" }));
    const ok = await run("Blocked dates saved", updateSeason(record.id, {
      name: record.name, startDate: record.startDate || null, endDate: record.endDate || null, registrationDeadline: record.registrationDeadline || null,
      blockedDates: toDays([...past, ...upcoming]),
    }));
    if (ok) { setDirty(false); load(); }
  };

  return (
    <Card loading={loading}>
      <Form form={form} layout="vertical" onValuesChange={() => { setDirty(true); setChanged(true); }} data-testid="settings.blocked-dates">
        <Form.List name="blocked">
          {(fields, { add, remove }) => (<>
            {fields.length === 0 && <Typography.Paragraph type="secondary">No upcoming blocked dates.</Typography.Paragraph>}
            {fields.map((f) => (
              <Space key={f.key} align="baseline" style={{ display: "flex" }} wrap>
                <Form.Item name={[f.name, "range"]} rules={[{ required: true, message: "Pick the dates" }, {
                  validator: (_, r) => (r?.[0] && r[1].diff(r[0], "day") > 90 ? Promise.reject(new Error("At most 90 days in one row")) : Promise.resolve()),
                }]}>
                  <DatePicker.RangePicker format="D MMM YYYY" disabledDate={(d) => d.isBefore(dj().startOf("day"))} placeholder={["From", "To (same day for one day)"]} />
                </Form.Item>
                <Form.Item name={[f.name, "label"]}><Input placeholder="e.g. Mid-sem exams" maxLength={60} /></Form.Item>
                <Button size="small" onClick={() => remove(f.name)}>Remove</Button>
              </Space>
            ))}
            <Space wrap>
              <Button onClick={() => add()}>Add dates</Button>
              <SaveButton dirty={changed} onClick={save} />
            </Space>
          </>)}
        </Form.List>
      </Form>
      {past.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Button type="link" style={{ padding: 0 }} onClick={() => setShowPast(!showPast)}>{showPast ? "Hide" : "Show"} past blocked dates ({past.length})</Button>
          {showPast && <List size="small" dataSource={[...past].reverse()} renderItem={(x) => <List.Item>{x.from === x.to ? day(x.from) : `${day(x.from)} - ${day(x.to)}`} · {x.label}</List.Item>} />}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------- Placement rules
function RulesTab() {
  const { setDirty } = useDirty();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const v = Form.useWatch([], form) || {};
  const run = useRun();
  const load = useCallback(() => {
    setLoading(true); setError(false);
    fetchWithErrorHandling(getPlacementRules()).then((r) => {
      setLoading(false);
      if (!r.success) { setError(true); return; }
      form.setFieldsValue(r.data);
    });
  }, [form]);
  useEffect(() => { load(); }, [load]);
  if (error) return <PanelError title="Couldn't load your placement rules" onRetry={load} />;
  const held = Number(v.maxHeldOffers ?? 1);
  const next = Math.round(5 * (100 + Number(v.upliftPct ?? 40))) / 100;
  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Card loading={loading} title="Offers and placed">
        <Typography.Paragraph type="secondary">The placed numbers (Home, Students, Reports) follow the first rule as soon as you save; the offer rules apply to offers released from then on.</Typography.Paragraph>
        <Form form={form} layout="vertical" onValuesChange={() => { setDirty(true); setChanged(true); }}>
          <Space wrap align="baseline" size={4}>A student counts as placed when the offer is <Form.Item name="countsAsPlacedAt" noStyle><Select style={{ width: 150 }} options={[{ value: "OFFER_RELEASED", label: "released" }, { value: "OFFER_ACCEPTED", label: "accepted" }]} /></Form.Item>.</Space>
          <Divider style={{ margin: "12px 0" }} />
          <Space wrap align="baseline" size={4}>A student may hold <Form.Item name="maxHeldOffers" noStyle><InputNumber min={1} max={5} /></Form.Item> {held === 1 ? "offer" : "offers"} (released or accepted) before the next rule applies.</Space>
          <Divider style={{ margin: "12px 0" }} />
          <Space wrap align="baseline" size={4}>After that, another offer needs a CTC at least <Form.Item name="upliftPct" noStyle><InputNumber min={0} max={200} /></Form.Item>% higher than their best offer, or a Dream drive. Internships never count.</Space>
          <Divider style={{ margin: "12px 0" }} />
          <Space wrap align="baseline" size={4}>Offers give at least <Form.Item name="minResponseHours" noStyle><InputNumber min={12} max={168} /></Form.Item> hours to respond. You can extend by up to 48 hours; longer needs the company.</Space>
        </Form>
        <Alert style={{ margin: "16px 0" }} type="info" showIcon message="For example"
          description={`A student holding ${held === 1 ? "a 5 LPA offer" : `${held} offers, the best at 5 LPA,`} can take another only if it is at least ${next} LPA, or from a Dream drive.`} />
        <SaveButton dirty={changed} loading={saving} onClick={async () => { setSaving(true); if (await run("Placement rules saved", savePlacementRules(await form.validateFields()))) { setDirty(false); setChanged(false); } setSaving(false); }} />
      </Card>
      <CgpaRule />
    </Space>
  );
}

/**
 * How a CGPA counts as a percentage, so one "10th at least 60%" works across boards. Marks stay as the student earned
 * them; only the comparable percentage beside them changes, and every student is recomputed when the rule changes.
 */
function CgpaRule() {
  const [view, setView] = useState(null);
  const [picked, setPicked] = useState(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState(false);
  const load = useCallback(() => {
    setError(false);
    fetchWithErrorHandling(getCgpaRule()).then((r) => {
      if (!r.success) { setError(true); return; }
      setView(r.data); setPicked(r.data.rule);
    });
  }, []);
  useEffect(() => { load(); }, [load]);
  if (error) return <PanelError title="Couldn't load the CGPA rule" onRetry={load} />;
  if (!view) return <Card><Skeleton active paragraph={{ rows: 1 }} /></Card>;
  const label = (k) => (view.options || []).find((o) => o.value === k)?.label || k;
  const save = () => Modal.confirm({
    title: "Change how a CGPA counts as a percentage?",
    content: `Every student's comparable percentage is recalculated with ${label(picked)}. Their marks as earned do not change. Percentage filters and eligibility use the new numbers from now on.`,
    okText: "Change and recalculate",
    onOk: async () => {
      if (savingRef.current) return;
      savingRef.current = true;
      setSaving(true);
      try {
        const r = await fetchWithErrorHandling(saveCgpaRule(picked));
        if (!r.success) { message.error(r?.data?.message || "Could not change the CGPA rule"); return; }
        setView(r.data);
        message.success(`CGPA rule changed. ${r.data.recomputed} ${r.data.recomputed === 1 ? "student" : "students"} recalculated.`);
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
  });
  return (
    <Card title="Marks in different systems" data-testid="settings.cgpa-rule">
      <Typography.Paragraph type="secondary" style={{ margin: "0 0 12px" }}>
        Students&apos; marks are shown as they earned them (9.2 CGPA, 86%, A1). For filters and eligibility a CGPA also gets a comparable percentage, worked out with your university&apos;s rule.
      </Typography.Paragraph>
      <Space wrap align="baseline" size={8}>
        A CGPA counts as a percentage using
        <Select style={{ width: 260 }} value={picked} onChange={setPicked} options={view.options} aria-label="CGPA to percentage rule" />
        <Button type="primary" disabled={picked === view.rule} loading={saving} onClick={save}>Change</Button>
      </Space>
      <Typography.Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
        Example: 9.2 CGPA is about {pctExample(picked)}%. Letter grades have no percentage and are left out of percentage filters.
      </Typography.Paragraph>
    </Card>
  );
}

const pctExample = (rule) => {
  const g = 9.2;
  const v = rule === "MINUS_0_5_X10" ? (g - 0.5) * 10 : rule === "MINUS_0_75_X10" ? (g - 0.75) * 10 : rule === "X10" ? g * 10 : g * 9.5;
  return Number(v.toFixed(1));
};

// ---------------------------------------------------------------- Prep readiness
function PrepTab() {
  const { setDirty } = useDirty();
  const [s, setS] = useState(null);
  const [courses, setCourses] = useState([]);
  const [coursesFailed, setCoursesFailed] = useState(false);
  const [error, setError] = useState(false);
  const [changed, setChanged] = useState(false);
  const run = useRun();
  const load = useCallback(() => {
    setError(false); setCoursesFailed(false);
    fetchWithErrorHandling(getCollegeSettings()).then((r) => { if (r.success) setS({ prepCourseIds: r.data.prepCourseIds || [], prepThresholdPct: r.data.prepThresholdPct }); else setError(true); });
    fetchWithErrorHandling(getPrepCourses()).then((r) => { if (!r.success) setCoursesFailed(true); setCourses(Array.isArray(r.data) ? r.data : []); });
  }, []);
  useEffect(() => { load(); }, [load]);
  if (error) return <PanelError title="Couldn't load your prep settings" onRetry={load} />;
  if (!s) return <Card loading />;
  const set = (patch) => { setDirty(true); setChanged(true); setS({ ...s, ...patch }); };
  return (
    <Card data-testid="settings.prep">
      {coursesFailed && <Alert type="warning" showIcon style={{ marginBottom: 12 }} message="The course list could not be loaded." action={<Button size="small" onClick={load}>Retry</Button>} />}
      <Form layout="vertical">
        <Form.Item label="Prep courses" extra="Their average progress decides readiness. With none picked, nobody is marked as needing prep.">
          <Select mode="multiple" style={{ width: "100%" }} value={s.prepCourseIds} onChange={(v) => set({ prepCourseIds: v })} optionFilterProp="label"
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
            disabled={coursesFailed}
            placeholder={coursesFailed ? "Course list unavailable" : "Choose courses"} />
        </Form.Item>
        <Form.Item label="Ready when their progress is at least">
          <InputNumber min={0} max={100} addonAfter="%" value={s.prepThresholdPct} onChange={(v) => set({ prepThresholdPct: v })} />
        </Form.Item>
      </Form>
      <SaveButton dirty={changed} onClick={async () => { if (await run("Prep readiness saved", saveCollegeSettings({ prepCourseIds: s.prepCourseIds, prepThresholdPct: s.prepThresholdPct }))) { setDirty(false); setChanged(false); } }} />
    </Card>
  );
}

// ---------------------------------------------------------------- What companies see
function SeeTab() {
  const { setDirty } = useDirty();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [changed, setChanged] = useState(false);
  const [error, setError] = useState(false);
  const run = useRun();
  const load = useCallback(() => {
    setLoading(true); setError(false);
    fetchWithErrorHandling(getWhatCompaniesSee()).then((r) => {
      setLoading(false);
      if (!r.success) { setError(true); return; }
      form.setFieldsValue(r.data);
    });
  }, [form]);
  useEffect(() => { load(); }, [load]);
  if (error) return <PanelError title="Couldn't load these settings" onRetry={load} />;
  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Card loading={loading}>
        <Form form={form} layout="vertical" onValuesChange={() => { setDirty(true); setChanged(true); }}>
          <Form.Item name="showCgpaExact" label="Show the exact UG % (off shows a band such as 75-80%)" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="showTenthTwelfth" label="Show 10th and 12th / diploma %" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="showProjectLinks" label="Show project links (GitHub, portfolio)" valuePropName="checked"><Switch /></Form.Item>
        </Form>
        <SaveButton dirty={changed} onClick={async () => { const v = await form.validateFields(); if (await run("Saved", saveWhatCompaniesSee({ showCgpaExact: Boolean(v.showCgpaExact), showTenthTwelfth: Boolean(v.showTenthTwelfth), showProjectLinks: Boolean(v.showProjectLinks) }))) { setDirty(false); setChanged(false); } }} />
      </Card>
      <Card title="How sharing works">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Each time you share applicants you tick the columns: name, roll number, branch, UG %, 10th, 12th, email, phone, resume, project links, stage.</li>
          <li>Marks are percentages, worked out with your CGPA rule, and only marks you have verified are shared.</li>
          <li>Phone numbers show only from the shortlist stage on.</li>
          <li>Never shown, whatever you choose: no-shows, debarments, prep scores and your notes.</li>
          <li>90 days after a drive closes, contact details and resumes of students it did not hire are hidden from the company.</li>
        </ul>
      </Card>
    </Space>
  );
}

// ---------------------------------------------------------------- Branding
function BrandingTab() {
  const { setDirty } = useDirty();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [changed, setChanged] = useState(false);
  const [error, setError] = useState(false);
  const signature = Form.useWatch("emailSignature", form);
  // The college's one logo is set by 42LMS (super admin > Manage College > Branding); TPO sees it here.
  const [logo, setLogo] = useState(null);
  const run = useRun();
  const load = useCallback(() => {
    setLoading(true); setError(false);
    fetchWithErrorHandling(getCollegeSettings()).then((r) => {
      setLoading(false);
      if (!r.success) { setError(true); return; }
      setLogo(r.data.logoUrl || null);
      form.setFieldsValue({ emailSignature: r.data.emailSignature });
    });
  }, [form]);
  useEffect(() => { load(); }, [load]);
  if (error) return <PanelError title="Couldn't load your branding" onRetry={load} />;
  return (
    <Card loading={loading}>
      <Form form={form} layout="vertical" onValuesChange={() => { setDirty(true); setChanged(true); }}>
        <Form.Item label="College logo" extra="Your college's logo across 42LMS. To change it, contact 42LMS support.">
          {logo
            ? <img src={logo} alt="College logo" data-testid="settings.branding.logo" style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 8, border: "1px solid #e7ecf2", padding: 4, background: "#fff" }} />
            : <Typography.Text type="secondary">No logo yet. 42LMS adds it when your college is set up.</Typography.Text>}
        </Form.Item>
        <Form.Item name="emailSignature" label="Email signature" extra="Ends every recruiter invite and placement email.">
          <Input.TextArea rows={3} maxLength={300} placeholder={"Training and Placement Cell\nYour college's name"} />
        </Form.Item>
      </Form>
      <div className="tpo-settings__preview" data-testid="settings.branding.preview" style={{ border: "1px dashed #d9d9d9", borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>How the end of an invite looks</Typography.Text>
        <Space align="start">
          {logo ? <img src={logo} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} /> : null}
          <Typography.Paragraph style={{ margin: 0, whiteSpace: "pre-line" }}>{signature?.trim() || <Typography.Text type="secondary">No signature yet</Typography.Text>}</Typography.Paragraph>
        </Space>
      </div>
      <SaveButton dirty={changed} onClick={async () => { const v = await form.validateFields(); if (await run("Saved", saveCollegeSettings({ emailSignature: v.emailSignature }))) { setDirty(false); setChanged(false); } }} />
    </Card>
  );
}

// ---------------------------------------------------------------- Student notices
// Students get email only for signing in and for interviews (13 Oct 2026); everything else reaches them in the app.
const ALWAYS_ON = ["Interview scheduled or changed", "Offer released or expiring", "Drive cancelled", "Application deadline today"];
const TEMPLATE_LABEL = {
  "share-link": "Share link to a company", "share-code": "Code for a company", "recruiter-invite": "Recruiter invite", "recruiter-invite-reminder": "Recruiter invite reminder",
  "recruiter-welcome": "Recruiter welcome", "recruiter-request-decision": "Decision on a drive request", "recruiter-message": "Message to a recruiter",
  "recruiter-offer-lapsed": "A student's offer lapsed", "shortlist-due-tomorrow": "Shortlist due tomorrow", "recruiter-campaign": "Email campaign",
  "round-scheduled": "Interview scheduled (student)", "round-reminder": "Interview reminder (student)",
};

function NoticesTab() {
  const { setDirty } = useDirty();
  const [cap, setCap] = useState(null);
  const [used, setUsed] = useState(0);
  const [mail, setMail] = useState(null);
  const [showOff, setShowOff] = useState(false);
  const [changed, setChanged] = useState({ cap: false });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const run = useRun();
  const load = useCallback(() => {
    setError(false);
    fetchWithErrorHandling(getCollegeSettings()).then((r) => {
      if (!r.success) { setError(true); return; }
      setCap(r.data.smsMonthlyCap); setUsed(r.data.smsUsedThisMonth || 0); setLoaded(true);
    });
    fetchWithErrorHandling(getMailStatus()).then((r) => setMail(r.success ? (r.data?.templates || {}) : false));
  }, []);
  useEffect(() => { load(); }, [load]);
  if (error) return <PanelError title="Couldn't load your notice settings" onRetry={load} />;
  if (!loaded) return <Card loading />;
  const mark = (k) => { setDirty(true); setChanged((c) => ({ ...c, [k]: true })); };
  const saved = (k) => setChanged((c) => { const n = { ...c, [k]: false }; if (!n.cap) setDirty(false); return n; });
  const off = mail ? Object.keys(TEMPLATE_LABEL).filter((k) => !mail[k]) : [];
  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Card title="Student emails" data-testid="tpo.settings.student-emails">
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          Students get an email only to sign in and for their interviews: when an interview is scheduled or changed, and a reminder the evening before.
          Everything else (drives, results, offers, announcements) reaches them in the app.
        </Typography.Paragraph>
      </Card>
      <Card title="SMS">
        <Typography.Text strong>Always sent by SMS, never counted against the limit</Typography.Text>
        <div style={{ margin: "6px 0 16px" }}>{ALWAYS_ON.map((t) => <Tag key={t}>{t}</Tag>)}</div>
        <Form layout="vertical">
          <Form.Item label="Monthly limit on optional SMS" extra={`${used} used this month. Optional sends stop at the limit, and every send preview shows the count.`}>
            <InputNumber min={0} max={100000} value={cap} onChange={(v) => { mark("cap"); setCap(v); }} addonAfter="SMS" />
          </Form.Item>
        </Form>
        <SaveButton dirty={changed.cap} onClick={async () => { if (await run("Saved", saveCollegeSettings({ smsMonthlyCap: cap }))) saved("cap"); }} />
      </Card>
      <Card title="Emails switched on">
        {mail === null && <Skeleton active paragraph={{ rows: 1 }} />}
        {mail === false && <Alert type="warning" showIcon message="Couldn't check which emails are switched on." action={<Button size="small" onClick={load}>Retry</Button>} />}
        {mail && (off.length === 0
          ? <Typography.Text>Every placement email is switched on.</Typography.Text>
          : (<>
            <Typography.Paragraph style={{ marginBottom: 4 }}>{off.length} of {Object.keys(TEMPLATE_LABEL).length} placement emails aren&apos;t switched on yet. Students and recruiters still see these in the app; 42LMS switches the emails on.</Typography.Paragraph>
            <Button type="link" style={{ padding: 0 }} onClick={() => setShowOff(!showOff)}>{showOff ? "Hide" : "Show"} which</Button>
            {showOff && <div style={{ marginTop: 6 }}>{off.map((k) => <Tag key={k}>{TEMPLATE_LABEL[k]}</Tag>)}</div>}
          </>))}
      </Card>
    </Space>
  );
}

// ---------------------------------------------------------------- Recruiters
const ACCESS_CHOICES = [[3, "3 months"], [6, "6 months"], [12, "12 months"], [24, "24 months"], [0, "No end date"]];

/** How recruiters work with the college: approval of their drive requests (with trusted domains as the exception), and access length. */
function RecruiterRules({ settings, onSaved }) {
  const [s, setS] = useState({ approval: settings.recruiterDriveNeedsApproval !== false, months: settings.recruiterAccessMonths ?? 6, sees: settings.recruiterSeesApplicants === "DIRECT" ? "DIRECT" : "AFTER_REVIEW" });
  const [domains, setDomains] = useState(Array.isArray(settings.trustedDomains) ? settings.trustedDomains : []);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const run = useRun();
  const save = async (next) => {
    const before = s;
    setS(next); setSaving(true);
    if (!(await run("Saved", saveCollegeSettings({ recruiterDriveNeedsApproval: next.approval, recruiterAccessMonths: next.months, recruiterSeesApplicants: next.sees })))) setS(before);
    else onSaved?.();
    setSaving(false);
  };
  const saveDomains = async (next) => { if (await run("Saved", saveCollegeSettings({ trustedDomains: next }))) setDomains(next); };
  const d = normaliseDomain(value);
  const choices = ACCESS_CHOICES.some(([m]) => m === s.months) ? ACCESS_CHOICES : [...ACCESS_CHOICES, [s.months, `${s.months} months`]];
  return (
    <Card className="tpo-settings__recruiter-rules" title="How recruiters work with you" data-testid="tpo.settings.recruiter-rules">
      <div className="tpo-settings__rule">
        <div>
          <Typography.Text strong>Approve each drive a recruiter requests</Typography.Text>
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
            {s.approval ? "On: a request waits for your approval before you set dates and publish it." : "Off: a request is approved as it arrives (unless the recruiter is still waiting for verification). You still set dates and publish."}
          </Typography.Paragraph>
        </div>
        <Switch checked={s.approval} loading={saving} onChange={(v) => save({ ...s, approval: v })} aria-label="Approve each drive a recruiter requests" />
      </div>
      {s.approval ? (
        <div className="tpo-settings__trusted" data-testid="settings.trusted" style={{ padding: "4px 0 12px 16px", borderLeft: "2px solid #f0f0f0", marginBottom: 8 }}>
          <Typography.Text strong>Except trusted companies</Typography.Text>
          <Typography.Paragraph type="secondary" style={{ margin: "0 0 8px" }}>Once a recruiter from one of these email domains is verified, their requests skip your approval. Free-mail domains such as gmail.com can&apos;t be trusted.</Typography.Paragraph>
          <Space.Compact style={{ marginBottom: 8, maxWidth: "100%" }}>
            <Input placeholder="infosys.com" value={value} onChange={(e) => setValue(e.target.value)} style={{ width: 240, minWidth: 0 }} onPressEnter={() => { if (d && !domains.includes(d)) { saveDomains([...domains, d]); setValue(""); } }} />
            <Button disabled={!d || domains.includes(d)} onClick={() => { saveDomains([...domains, d]); setValue(""); }}>Trust @{d || "domain"}</Button>
          </Space.Compact>
          {value.trim() && !d && <Typography.Text type="danger" style={{ display: "block", marginBottom: 8 }}>Enter a company domain such as infosys.com.</Typography.Text>}
          {d && domains.includes(d) && <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>This domain is already trusted.</Typography.Text>}
          <div>{domains.length === 0 ? <Typography.Text type="secondary">No trusted domains.</Typography.Text> : domains.map((x) => (
            <Popconfirm key={x} title={`Stop trusting @${x}?`} description="New requests from this domain will wait for your approval again." okText="Stop trusting" okButtonProps={{ danger: true }} onConfirm={() => saveDomains(domains.filter((y) => y !== x))}>
              <Tag closable onClose={(e) => e.preventDefault()} style={{ cursor: "pointer" }}>@{x}</Tag>
            </Popconfirm>
          ))}</div>
        </div>
      ) : domains.length > 0 && (
        <Typography.Paragraph type="secondary" style={{ paddingLeft: 16 }}>{domains.length} trusted {domains.length === 1 ? "domain is" : "domains are"} kept for when you switch approval back on.</Typography.Paragraph>
      )}
      <div className="tpo-settings__rule">
        <div>
          <Typography.Text strong>Recruiters see applicants</Typography.Text>
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
            {s.sees === "DIRECT"
              ? "As they apply: names, marks, resumes and stages. Email and phone stay hidden until you share them, though most resumes include them."
              : "After your review: only once you share the applicant list with them."}
          </Typography.Paragraph>
        </div>
        <Select style={{ width: 200 }} value={s.sees} disabled={saving} onChange={(v) => save({ ...s, sees: v })} aria-label="Recruiters see applicants"
          options={[{ value: "AFTER_REVIEW", label: "After your review" }, { value: "DIRECT", label: "As they apply" }]} />
      </div>
      <div className="tpo-settings__rule">
        <div>
          <Typography.Text strong>Recruiter access lasts</Typography.Text>
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>Counted from when they join. You can extend anyone below.</Typography.Paragraph>
        </div>
        <Select style={{ width: 160 }} value={s.months} disabled={saving} onChange={(m) => save({ ...s, months: m })} options={choices.map(([m, l]) => ({ value: m, label: l }))} aria-label="Recruiter access lasts" />
      </div>
    </Card>
  );
}

const STATUS_FILTERS = [{ value: "active", label: "Active" }, { value: "soon", label: "Ending in 30 days" }, { value: "ended", label: "Ended or removed" }, { value: "all", label: "All" }];

function RecruitersTab() {
  const [recruiterAccess, setRecruiterAccess] = useState([]);
  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const run = useRun();
  const load = useCallback(async () => {
    setLoading(true); setError(false);
    const [r, s] = await Promise.all([fetchWithErrorHandling(listRecruiterAccess()), fetchWithErrorHandling(getCollegeSettings())]);
    setLoading(false);
    if (!r.success || !s.success) { setError(true); return; }
    setRecruiterAccess(Array.isArray(r.data) ? r.data : []); setSettings(s.data || {});
  }, []);
  useEffect(() => { load(); }, [load]);
  if (error) return <PanelError title="Couldn't load your recruiters" onRetry={load} />;
  if (!settings) return <Card loading />;

  const soon = (recruiter) => recruiter.status === "ACTIVE" && !recruiter.expired && recruiter.validUntil && dj(recruiter.validUntil).diff(dj(), "day") <= 30;
  const live = (recruiter) => recruiter.status === "ACTIVE" && !recruiter.expired;
  const rows = recruiterAccess
    .filter((recruiter) => (status === "all" ? true : status === "active" ? live(recruiter) : status === "soon" ? soon(recruiter) : !live(recruiter)))
    .sort((a, b) => (live(b) - live(a)) || String(a.validUntil || "9999").localeCompare(String(b.validUntil || "9999")));
  const counts = { active: recruiterAccess.filter(live).length, soon: recruiterAccess.filter(soon).length, ended: recruiterAccess.filter((h) => !live(h)).length, all: recruiterAccess.length };
  const access = (recruiter) => {
    if (recruiter.status !== "ACTIVE") return <Typography.Text type="secondary">Removed{recruiter.revokedAt ? ` ${day(recruiter.revokedAt)}` : ""}</Typography.Text>;
    if (recruiter.expired) return <Typography.Text type="danger">Ended {day(recruiter.validUntil)}</Typography.Text>;
    if (!recruiter.validUntil) return "No end date";
    return <Typography.Text type={soon(recruiter) ? "warning" : undefined}>Until {day(recruiter.validUntil)}</Typography.Text>;
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <RecruiterRules settings={settings} onSaved={() => {}} />
      <PublicLinkCard />
      <Card loading={loading} data-testid="tpo.settings.recruiter-access" title="Recruiters with access to your college"
        extra={<Link href="/tpo/recruiters?f_stage=INVITED">Invites not yet accepted</Link>}>
        <div className="tpo-settings__segmented-scroll"><Segmented style={{ marginBottom: 12 }} value={status} onChange={setStatus} options={STATUS_FILTERS.map((f) => ({ value: f.value, label: `${f.label} (${counts[f.value]})` }))} /></div>
        <TpoDataTable compact selectable={false} searchInUrl={false} testid="settings-recruiters" data={rows} rowKey="recruiterId" exportName="recruiters"
          emptyTitle={recruiterAccess.length ? "No one here" : "No recruiter has joined yet"} emptySubtitle={recruiterAccess.length ? "Try another status above." : "Invite one from Engage."}
          searchOf={(recruiter) => `${recruiter.name || ""} ${recruiter.company || ""} ${recruiter.designation || ""} ${recruiter.phone || ""}`}
          columns={[
            { title: "Recruiter", key: "name", exportValue: (recruiter) => recruiter.name, render: (_, recruiter) => <>{recruiter.name}{recruiter.designation && <div><Typography.Text type="secondary">{recruiter.designation}</Typography.Text></div>}</> },
            { title: "Company", dataIndex: "company", render: (v) => v || "-" },
            { title: "Phone", dataIndex: "phone", render: (v) => v || "-" },
            // How they came in (audit 13 Oct 2026, L9): the public link is what direct posting depends on.
            { title: "Joined through", key: "joinedVia", exportValue: (recruiter) => JOINED_VIA[recruiter.joinedVia] || "Invitation",
              render: (_, recruiter) => (recruiter.joinedVia === "PUBLIC_LINK" ? <Tag color="gold">Public link</Tag> : JOINED_VIA[recruiter.joinedVia] || "Invitation") },
            { title: "Access", key: "access", exportValue: (recruiter) => (recruiter.status !== "ACTIVE" ? "Removed" : recruiter.expired ? `Ended ${day(recruiter.validUntil)}` : recruiter.validUntil ? `Until ${day(recruiter.validUntil)}` : "No end date"), render: (_, recruiter) => access(recruiter) },
            { title: "", key: "actions", width: 190, render: (_, recruiter) => (recruiter.status === "ACTIVE" ? (
              <Space size={0}>
                <Dropdown trigger={["click"]} menu={{ items: [[3, "3 months"], [6, "6 months"], [12, "12 months"], [0, "No end date"]].map(([m, l]) => ({ key: String(m), label: l,
                  onClick: () => Modal.confirm({ title: m === 0 ? `Give ${recruiter.name} access with no end date?` : `Give ${recruiter.name} ${l} more?`, content: m === 0 ? "They keep access until you remove it." : "Counted from today, or from their current end date if that is later.",
                    okText: "Extend", onOk: () => run("Access extended", extendRecruiterAccess(recruiter.recruiterId, m), load) }) })) }}><Button type="link" size="small">{recruiter.expired ? "Give access again…" : "Extend…"}</Button></Dropdown>
                <Popconfirm title={`Remove ${recruiter.name}'s access?`} description="They will no longer see your college, at once. Your public and company links won't let them back in; only a new invitation from you does." okText="Remove" okButtonProps={{ danger: true }}
                  onConfirm={() => run("Access removed", revokeRecruiterAccess(recruiter.recruiterId, "Removed by the placement cell"), load)}><Button type="link" size="small" danger>Remove</Button></Popconfirm>
              </Space>
            ) : <Typography.Text type="secondary">Invite again from Engage</Typography.Text>) },
          ]} />
      </Card>
    </Space>
  );
}
