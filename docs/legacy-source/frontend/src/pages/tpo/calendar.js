import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { Alert, Badge, Button, Calendar, Card, DatePicker, Empty, List, Modal, Popover, Segmented, Select, Skeleton, Space, Typography, message } from "antd";
import { dj, serverTime } from "@/components/tpo/dj";
import WeekTimeGrid from "@/components/tpo/WeekTimeGrid";
import FollowUpModal from "@/components/tpo/FollowUpModal";
import PageShell from "@/components/Common/PageShell";
import { PanelError } from "@/components/Common/PanelStates";
import { ListSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { markFollowUpDone, moveFollowUp } from "@/api/Services/TpoService";
import { getCalendar } from "@/api/Services/TpoHubService";
import AsyncModal from "@/components/tpo/ui/AsyncModal";

const TYPE = { ROUND: ["Round", "#0958d9"], TALK: ["Talk", "#6b2fd1"], DEADLINE: ["Deadline", "#b34700"], FOLLOW_UP: ["Follow-up", "#0a7c88"], BLOCKED: ["Blocked", "#5b6b82"] };

/**
 * Calendar (TPO V1 - Locked.docx §7): Week (default), Month, Agenda (default on mobile). Rounds, talks, deadlines, follow-ups and blocked
 * dates, each with a colour, and filters for type, owner and company. Click an item for a popover with Open. Only follow-ups can be
 * moved; rounds are changed from the drive.
 */
export default function TpoCalendar() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [view, setView] = useState("week");
  const [anchor, setAnchor] = useState(dj());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [types, setTypes] = useState(Object.keys(TYPE));
  const [company, setCompany] = useState(null);
  const [moving, setMoving] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [moveTo, setMoveTo] = useState(null);
  const [creatingAt, setCreatingAt] = useState(null); // dayjs of the clicked slot
  // Today and the next 7 days, and the last 90 days of follow-ups (to find overdue ones), whatever range the calendar shows.
  const [soon, setSoon] = useState([]);
  const [past, setPast] = useState([]);
  const [soonError, setSoonError] = useState(null);
  const [pastError, setPastError] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [followUpBusyId, setFollowUpBusyId] = useState(null);
  const [focus, setFocus] = useState(null); // a "Needs doing" link that is picked
  const rangeSeqRef = useRef(0);
  const summarySeqRef = useRef(0);
  const followUpBusyRef = useRef(false);

  useEffect(() => { dispatch(appAction.setActiveMenuItem("calendar")); }, [dispatch]);
  useEffect(() => { if (typeof window !== "undefined" && window.innerWidth < 768) setView("agenda"); }, []);

  const range = useMemo(() => {
    if (view === "week") return [anchor.startOf("week"), anchor.endOf("week")];
    if (view === "month") return [anchor.startOf("month").startOf("week"), anchor.endOf("month").endOf("week")];
    return [anchor.startOf("day"), anchor.add(30, "day").endOf("day")];
  }, [view, anchor]);

  // Calendar had no loading state at all (empty and loading looked identical) and a genuine API
  // failure was silently turned into an empty calendar rather than a visible error.
  const load = useCallback(async ({ preserveExisting = true } = {}) => {
    const requestId = ++rangeSeqRef.current;
    setLoading(true);
    setError(null);
    if (!preserveExisting) setEvents([]);
    const res = await fetchWithErrorHandling(getCalendar(range[0].format("YYYY-MM-DD"), range[1].format("YYYY-MM-DD")));
    if (requestId !== rangeSeqRef.current) return;
    setLoading(false);
    if (!res.success) { setError(res?.data?.message || res?.data?.error || "Could not load the calendar"); return; }
    setError(null);
    setEvents(Array.isArray(res.data) ? res.data : []);
  }, [range]);
  useEffect(() => { load({ preserveExisting: false }); }, [load]);
  const loadSoon = useCallback(async () => {
    const requestId = ++summarySeqRef.current;
    const today = dj().startOf("day");
    setSummaryLoading(true);
    const [a, b] = await Promise.all([
      fetchWithErrorHandling(getCalendar(today.format("YYYY-MM-DD"), today.add(7, "day").format("YYYY-MM-DD"))),
      fetchWithErrorHandling(getCalendar(today.subtract(90, "day").format("YYYY-MM-DD"), today.format("YYYY-MM-DD"))),
    ]);

    if (requestId !== summarySeqRef.current) return;

    if (a.success) {
      setSoon(Array.isArray(a.data) ? a.data : []);
      setSoonError(null);
    } else {
      // Preserve last-known upcoming rows. Empty means "nothing scheduled" only after a successful
      // source response; a failed summary lookup is unknown state.
      setSoonError(a?.data?.message || a?.data?.error || "Could not verify today and the next 7 days.");
    }

    if (b.success) {
      setPast(Array.isArray(b.data) ? b.data : []);
      setPastError(null);
    } else {
      // Past calendar rows power the overdue-follow-up counter, so this failure makes that
      // specific "needs doing" metric unknown even if the visible calendar range loaded fine.
      setPastError(b?.data?.message || b?.data?.error || "Could not verify overdue follow-ups.");
    }
    if (requestId === summarySeqRef.current) setSummaryLoading(false);
  }, []);
  useEffect(() => { loadSoon(); }, [loadSoon]);
  const reloadAll = () => { load(); loadSoon(); };

  // What needs doing on the calendar (docs/tpo-ux/BEST-VERSION-PROGRAMME-2026-10-05.md): each link opens a focused list with the
  // controls to deal with it, highlighted only when picked; a second click closes it.
  const work = useMemo(() => {
    const now = dj();
    const blockedDays = new Set(soon.filter((e) => e.type === "BLOCKED").map((e) => dj(e.startsAt).format("YYYY-MM-DD")));
    const perDay = new Map();
    soon.filter((e) => e.type !== "BLOCKED").forEach((e) => { const d = dj(e.startsAt).format("YYYY-MM-DD"); perDay.set(d, [...(perDay.get(d) || []), e]); });
    return [
      { key: "overdue", label: "Follow-ups overdue", items: past.filter((e) => e.type === "FOLLOW_UP" && dj(e.startsAt).isBefore(now)) },
      { key: "blocked", label: "Rounds on a blocked date", items: soon.filter((e) => ["ROUND", "TALK"].includes(e.type) && blockedDays.has(dj(e.startsAt).format("YYYY-MM-DD"))) },
      { key: "busy", label: "Busy days (3 or more)", items: [...perDay.values()].filter((list) => list.length >= 3).flat() },
    ];
  }, [soon, past]);
  const todayItems = soon.filter((e) => e.type !== "BLOCKED" && dj(e.startsAt).isSame(dj(), "day")).sort((a, b) => dj(a.startsAt).valueOf() - dj(b.startsAt).valueOf());
  const upcoming = soon.filter((e) => e.type !== "BLOCKED" && dj(e.startsAt).isAfter(dj().endOf("day"))).sort((a, b) => dj(a.startsAt).valueOf() - dj(b.startsAt).valueOf());

  const companies = useMemo(() => [...new Set(events.map((e) => e.company).filter(Boolean))], [events]);
  const schedule = useMemo(() => {
    const typeCounts = Object.fromEntries(Object.keys(TYPE).map((type) => [type, events.filter((e) => e.type === type).length]));
    const dayMap = new Map();
    events.forEach((e) => {
      const day = dj(e.startsAt).format("YYYY-MM-DD");
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    });
    const busiest = [...dayMap.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || null;
    const future = events.filter((e) => dj(e.startsAt).isAfter(dj())).sort((a, b) => dj(a.startsAt).valueOf() - dj(b.startsAt).valueOf());
    return {
      total: events.length,
      companies: companies.length,
      typeCounts,
      busiest: busiest ? { day: busiest[0], count: busiest[1] } : null,
      next: future[0] || null,
      maxType: Math.max(...Object.values(typeCounts), 1),
    };
  }, [events, companies.length]);
  const shown = events.filter((e) => types.includes(e.type) && (!company || e.company === company));
  const byDay = (d) => shown.filter((e) => dj(e.startsAt).isSame(d, "day"));

  const open = (e) => {
    if (e.jobId) router.push(`/tpo/drives/${e.jobId}${e.type === "ROUND" || e.type === "TALK" ? "?tab=rounds" : ""}`);
    else if (e.recruiterLeadId) router.push(`/tpo/recruiters/${e.recruiterLeadId}`);
  };

  const runFollowUpMutation = async (id, call, failure) => {
    if (followUpBusyRef.current) return false;
    followUpBusyRef.current = true;
    setFollowUpBusyId(id);
    try {
      const r = await fetchWithErrorHandling(call);
      if (!r.success) {
        message.error(r?.data?.message || r?.data?.error || failure);
        return false;
      }
      reloadAll();
      return true;
    } finally {
      followUpBusyRef.current = false;
      setFollowUpBusyId(null);
    }
  };

  // Dropping a follow-up on the grid moves it to exactly that day and time.
  const dropAt = async (e, at) => {
    await runFollowUpMutation(e.id, moveFollowUp(e.id, serverTime(at)), "Could not move it");
  };

  const item = (e, style, draggable) => {
    const typeMeta = TYPE[e.type] || [e.type || "Event", "#5b6b82"];
    return (
      <Popover key={`${e.type}-${e.id || e.jobId}-${e.startsAt}`} title={e.title} content={
        <Space direction="vertical">
          <span>{dj(e.startsAt).format("ddd D MMM, h:mm A")}</span>
          {e.venue && <span>{e.venue}</span>}
          {e.note && <span>{e.note}</span>}
          <Space>
            {(e.jobId || e.recruiterLeadId) && <Button size="small" type="primary" onClick={() => open(e)}>Open</Button>}
            {e.type === "FOLLOW_UP" && <Button size="small" disabled={followUpBusyId != null} onClick={() => { setMoving(e); setMoveTo(dj(e.startsAt)); }}>Move</Button>}
            {e.type === "FOLLOW_UP" && <Button size="small" loading={Number(followUpBusyId) === Number(e.id)} disabled={followUpBusyId != null} onClick={() => runFollowUpMutation(e.id, markFollowUpDone(e.id), "Could not mark it done")}>Done</Button>}
          </Space>
        </Space>}>
        <div
          className={`tpo-calendar__event ${e.type === "FOLLOW_UP" ? "tpo-calendar__event--draggable" : ""}`}
          style={{ "--event-color": typeMeta[1], ...(style || {}) }}
          draggable={draggable !== undefined ? draggable : e.type === "FOLLOW_UP"}
          onDragStart={() => setDragging(e)}
          onDragEnd={() => setDragging(null)}
          // BE-0122: the keyboard way to do what dragging does: Enter on a follow-up opens Move (pick a day and time);
          // on anything else it opens the item.
          tabIndex={0}
          role="button"
          aria-label={`${e.title}, ${dj(e.startsAt).format("ddd D MMM, h:mm A")}${e.type === "FOLLOW_UP" ? ". Press Enter to move it" : ""}`}
          onKeyDown={(ev) => {
            if (ev.key !== "Enter" && ev.key !== " ") return;
            ev.preventDefault();
            ev.stopPropagation();
            if (e.type === "FOLLOW_UP" && followUpBusyId == null) { setMoving(e); setMoveTo(dj(e.startsAt)); }
            else if (e.jobId || e.recruiterLeadId) open(e);
          }}
        >
          {e.type !== "BLOCKED" && e.type !== "DEADLINE" && <b>{dj(e.startsAt).format("h:mm A")} </b>}
          <span>{e.title}</span>
        </div>
      </Popover>
    );
  };

  const days = Array.from({ length: 7 }, (_, i) => range[0].add(i, "day"));
  const step = (dir) => setAnchor(view === "month" ? anchor.add(dir, "month") : view === "agenda" ? anchor.add(dir * 30, "day") : anchor.add(dir, "week"));
  const allTypes = types.length === Object.keys(TYPE).length;
  // One row of type chips is both the legend and the filter (it used to be a multi-select plus a separate legend listing the same five types).
  const toggleType = (k) => setTypes((t) => (allTypes ? [k] : t.includes(k) ? (t.length === 1 ? Object.keys(TYPE) : t.filter((x) => x !== k)) : [...t, k]));

  return (
    <div className="scroll-container tpo-calendar" data-testid="tpo.calendar">
      <PageShell>
        <ListingPageHeader
          className="tpo-calendar__header"
          title="Calendar"
          subtitle={<Typography.Text type="secondary">Coordinate rounds, talks, deadlines and recruiter follow-ups without losing the wider placement schedule.</Typography.Text>}
          rightContent={
            <Segmented
              className="tpo-calendar__view-switch"
              value={view}
              onChange={setView}
              options={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }, { value: "agenda", label: "Agenda" }]}
            />
          }
        />

        {(soonError || pastError) && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="Calendar summary is partially unavailable"
            description={[
              soonError ? "today / next 7 days" : null,
              pastError ? "overdue follow-ups" : null,
            ].filter(Boolean).join(" and ") + " could not be verified. Last-known rows are kept where available; missing rows are not treated as zero."}
            action={<Button size="small" loading={summaryLoading} onClick={loadSoon}>Retry summary</Button>}
          />
        )}
        <section className="tpo-nextstep is-todo tpo-calendar__today" aria-label="Today and the next 7 days" data-testid="calendar.today">
          <span className="tpo-nextstep__eyebrow">Today, {dj().format("ddd D MMM")}</span>
          {summaryLoading && soon.length === 0 ? <strong className="tpo-nextstep__title">Checking today&apos;s schedule…</strong>
            : soonError && soon.length === 0 ? <strong className="tpo-nextstep__title">Today&apos;s schedule could not be verified</strong>
            : todayItems.length === 0 ? <strong className="tpo-nextstep__title">Nothing scheduled today</strong> : (
            <div className="tpo-calendar__today-list">{todayItems.map((e) => (
              <button type="button" key={`${e.type}-${e.id || e.jobId}-${e.startsAt}`} className="tpo-calendar__today-item" onClick={() => open(e)} style={{ "--event-color": (TYPE[e.type] || [null, "#5b6b82"])[1] }}>
                <b>{e.type === "DEADLINE" ? "Today" : dj(e.startsAt).format("h:mm A")}</b> {e.title}{dj(e.startsAt).isBefore(dj()) && e.type !== "DEADLINE" ? <Typography.Text type="secondary"> · done</Typography.Text> : null}
              </button>
            ))}</div>
          )}
          <Typography.Text type="secondary">
            {summaryLoading && soon.length === 0
              ? "Checking the next 7 days…"
              : soonError && soon.length === 0
                ? "The next 7 days could not be verified."
                : upcoming.length
                  ? `Next 7 days: ${upcoming.length} ${upcoming.length === 1 ? "item" : "items"}, first ${upcoming[0].title} on ${dj(upcoming[0].startsAt).format("ddd D MMM")}.`
                  : "Nothing in the next 7 days."}
          </Typography.Text>
          {!summaryLoading && (soon.length > 0 || (!soonError && !pastError)) && work.some((w) => w.items.length) && (
            <div className="tpo-journey__extras" role="group" aria-label="Needs doing" data-testid="calendar.work">
              <Typography.Text type="secondary">Needs doing:</Typography.Text>
              {work.filter((w) => w.items.length || focus === w.key).map((w) => (
                <button type="button" key={w.key} className={`tpo-journey__extra${focus === w.key ? " is-on" : ""}`} aria-pressed={focus === w.key}
                  onClick={() => setFocus(focus === w.key ? null : w.key)} data-testid={`calendar.work.${w.key}`}>{w.label} · <strong>{w.items.length}</strong></button>
              ))}
            </div>
          )}
        </section>
        {focus && (
          <Card size="small" className="tpo-calendar__focus" title={work.find((w) => w.key === focus)?.label} data-testid="calendar.focus"
            extra={<Button size="small" type="link" onClick={() => setFocus(null)}>Close</Button>}>
            <div className="tpo-calendar__agenda-events">{(work.find((w) => w.key === focus)?.items || []).map((e) => item(e))}</div>
            <Typography.Text type="secondary">Click one for Open{focus === "overdue" ? ", Move or Done" : ""}.</Typography.Text>
          </Card>
        )}

        <Card className="tpo-calendar__command-bar">
          <div className="tpo-calendar__navigation">
            <Space className="tpo-calendar__nav-buttons">
              <Button onClick={() => step(-1)}>Previous</Button>
              <Button onClick={() => setAnchor(dj())}>Today</Button>
              <Button onClick={() => step(1)}>Next</Button>
            </Space>
            <div className="tpo-calendar__range">
              <Typography.Title level={4}>{view === "month" ? anchor.format("MMMM YYYY") : `${range[0].format("D MMM")} – ${range[1].format("D MMM YYYY")}`}</Typography.Title>
              <Typography.Text type="secondary">{shown.length} {shown.length === 1 ? "item" : "items"} in this {view === "month" ? "month" : view === "week" ? "week" : "period"}</Typography.Text>
            </div>
          </div>

          <div className="tpo-calendar__filters">
            <div className="tpo-calendar__type-chips" role="group" aria-label="Show event types">
              {Object.entries(TYPE).map(([k, [label, color]]) => (
                <button key={k} type="button" aria-pressed={!allTypes && types.includes(k)} title={allTypes ? `Show only ${label.toLowerCase()}s` : types.includes(k) ? "Hide" : "Show too"}
                  className={`tpo-calendar__type-chip ${allTypes ? "is-all" : types.includes(k) ? "is-on" : "is-off"}`}
                  style={{ "--chip-color": color }} onClick={() => toggleType(k)}>
                  <span className="tpo-calendar__type-dot" aria-hidden="true" />{label} <span className="tpo-calendar__type-count">{schedule.typeCounts[k] || 0}</span>
                </button>
              ))}
            </div>
            {(!allTypes || company) && <Button type="link" onClick={() => { setTypes(Object.keys(TYPE)); setCompany(null); }}>Show everything</Button>}
            <Select
              allowClear
              className="tpo-calendar__company-filter"
              placeholder="All companies"
              value={company}
              onChange={setCompany}
              options={companies.map((c) => ({ value: c, label: c }))}
            />
          </div>

        </Card>

        {error && events.length === 0 && !loading ? (
          <PanelError title={error} onRetry={() => load({ preserveExisting: false })} />
        ) : loading && events.length === 0 ? (
          <ListSkeleton rows={6} avatar={false} label="Loading placement calendar" />
        ) : (
          <>
            {loading && events.length > 0 && <RefreshStatus label="Refreshing calendar…" />}
            {error && <Alert className="tpo-calendar__stale-alert" type="error" showIcon closable message="This refresh failed. Showing the last successful load." description={error} action={<Button size="small" onClick={() => load({ preserveExisting: true })}>Retry</Button>} />}
            {view === "week" && <Typography.Paragraph type="secondary" className="tpo-calendar__hint">Click an empty time to add a follow-up; drag a follow-up to move it. Rounds are changed from their drive.</Typography.Paragraph>}
            {view === "week" && (
              <WeekTimeGrid
                days={days} events={shown} dragging={dragging} setDragging={setDragging}
                colorOf={(e) => (TYPE[e.type] || [null, "#5b6b82"])[1]}
                canDrag={(e) => e.type === "FOLLOW_UP"}
                renderEvent={(e, style, draggable) => item(e, style, draggable)}
                onSlotClick={(at) => setCreatingAt(at)}
                onDropEvent={dropAt}
              />
            )}
            {view === "month" && (
              <Card className="tpo-calendar__month">
                <Calendar value={anchor} onChange={setAnchor} headerRender={() => null}
                  cellRender={(d, info) => (info.type === "date" ? <div>{byDay(d).slice(0, 3).map((e) => {
                    const typeMeta = TYPE[e.type] || [e.type || "Event", "#5b6b82"];
                    return <div key={`${e.type}${e.id || e.jobId}${e.startsAt}`}><Badge color={typeMeta[1]} text={<button type="button" className="tpo-calendar__month-event" onClick={() => open(e)}>{e.title}</button>} /></div>;
                  })}{byDay(d).length > 3 && <Typography.Text className="tpo-calendar__more" type="secondary">+{byDay(d).length - 3} more</Typography.Text>}</div> : null)} />
              </Card>
            )}
            {view === "agenda" && (
              <Card className="tpo-calendar__agenda">
                {shown.length === 0 ? <Empty description="Nothing scheduled in this period" /> : (
                  <List dataSource={[...new Set(shown.map((e) => dj(e.startsAt).format("YYYY-MM-DD")))]} renderItem={(day) => (
                    <List.Item className="tpo-calendar__agenda-day">
                      <div className="tpo-calendar__agenda-date">
                        <Typography.Text className="tpo-calendar__eyebrow">{dj(day).format("dddd")}</Typography.Text>
                        <Typography.Title level={5}>{dj(day).format("D MMMM")}</Typography.Title>
                      </div>
                      <div className="tpo-calendar__agenda-events">
                        {shown.filter((e) => dj(e.startsAt).format("YYYY-MM-DD") === day).map(item)}
                      </div>
                    </List.Item>
                  )} />
                )}
              </Card>
            )}
          </>
        )}
      </PageShell>
      <FollowUpModal open={Boolean(creatingAt)} initialAt={creatingAt} onClose={() => setCreatingAt(null)} onSaved={() => { setCreatingAt(null); reloadAll(); }} />
      <AsyncModal
        open={Boolean(moving)}
        title="Move this follow-up"
        onCancel={() => { if (!followUpBusyRef.current) setMoving(null); }}
        confirmLoading={moving ? Number(followUpBusyId) === Number(moving.id) : false}
        okButtonProps={{ disabled: !moveTo || followUpBusyId != null }}
        onOk={async () => {
          // Was: mark the old one Done, then create a replacement - two separate requests, so a
          // failure on the second one left the follow-up completed with no replacement, silently
          // gone. Drag-and-drop already used the proper atomic Move endpoint; this modal now does too.
          const e = moving;
          if (!e || followUpBusyRef.current) return;
          const ok = await runFollowUpMutation(e.id, moveFollowUp(e.id, serverTime(moveTo)), "Could not move it");
          if (ok) setMoving(null);
        }}>
        <DatePicker showTime value={moveTo} onChange={setMoveTo} style={{ width: "100%" }} />
      </AsyncModal>
    </div>
  );
}
