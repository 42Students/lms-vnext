import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { Alert, Button, Drawer, Skeleton } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import moment from "moment";
import PlacementsTabsLayout from "@/layouts/PlacementsTabsLayout";
import Api from "@/api/ApiMethod";
import { getStudentCalendarExtras } from "@/api/Services/TpoHubService";
import { getInterviewsForLearner } from "@/api/Services/interviewService";
import useJourney from "@/components/Placements/student/useJourney";
import ScheduleCard from "@/components/Placements/student/ScheduleCard";
import { at, dayTime, isOver, isPast } from "@/components/Placements/student/words";

const VIEWS = [["ahead", "Coming up"], ["past", "Past"], ["month", "Calendar"]];

/** An interview from the older interview flow, drawn like a round (read-only: that flow has no confirm). */
function fromLegacy(iv) {
  const job = iv.job || iv.application?.job || {};
  const online = iv.interviewMode === "ONLINE";
  const live = ["SCHEDULED", "CONFIRMED"].includes(iv.interviewStatus);
  return {
    roundId: `iv-${iv.id}`, applicationId: iv.application?.id || `iv-${iv.id}`, kind: "INTERVIEW",
    name: iv.roundDescription || (iv.interviewType ? `${String(iv.interviewType).charAt(0)}${String(iv.interviewType).slice(1).toLowerCase()} interview` : "Interview"),
    company: job.companyName || "", role: job.jobTitle || "", jobId: job.id, logo: job.companyLogo,
    startsAt: iv.scheduledDate, mode: online ? "VIRTUAL" : "ON_CAMPUS", meetingUrl: online && /^https:\/\//.test(iv.location || "") ? iv.location : null,
    room: online ? null : iv.location, durationMinutes: iv.durationMinutes, live, booked: false, legacy: true,
    state: iv.interviewStatus === "COMPLETED" ? "DONE" : iv.interviewStatus === "NO_SHOW" ? "ABSENT" : null,
  };
}

function groupByDay(items) {
  const out = [];
  items.forEach((s) => {
    const m = at(s.startsAt);
    const key = m ? m.format("YYYY-MM-DD") : "tbd";
    let g = out.find((x) => x.key === key);
    if (!g) {
      const days = m ? m.clone().startOf("day").diff(moment().startOf("day"), "days") : null;
      const label = !m ? "Date to be told" : days === 0 ? `Today · ${m.format("ddd D MMM")}` : days === 1 ? `Tomorrow · ${m.format("ddd D MMM")}`
        : days === -1 ? `Yesterday · ${m.format("ddd D MMM")}` : m.format("dddd D MMMM");
      g = { key, label, items: [] };
      out.push(g);
    }
    g.items.push(s);
  });
  return out;
}

/**
 * Every test, talk and interview of the student's in one place (redesign, 14 Oct 2026): what was Assessments, Interviews and Career
 * Calendar. Those three read the older interview table, so a student with an interview booked by the placement cell for tomorrow read
 * "No interviews scheduled yet". This page reads the placement cell's rounds (and still shows any interview from the older flow), and
 * the student confirms or asks to reschedule right on the card.
 */
export default function SchedulePage() {
  const router = useRouter();
  const learnerId = useSelector((s) => s.loginUser?.id);
  const organizationId = useSelector((s) => s.loginUser?.collegeId ?? s.loginUser?.organizationId ?? null);
  const { journey, failed, loading, reload } = useJourney({ withOverview: false });
  const [legacy, setLegacy] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [month, setMonth] = useState(() => moment().startOf("month"));
  const [dayOpen, setDayOpen] = useState(null);
  const view = VIEWS.some(([k]) => k === router.query.view) ? router.query.view : "ahead";
  const setView = (v) => router.replace({ pathname: router.pathname, query: v === "ahead" ? {} : { view: v } }, undefined, { shallow: true });

  useEffect(() => { if (router.isReady && !learnerId) router.replace("/"); }, [router, router.isReady, learnerId]);

  useEffect(() => {
    if (!learnerId) return undefined;
    let live = true;
    getInterviewsForLearner(learnerId, organizationId)
      .then((r) => {
        const list = Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data?.data?.content) ? r.data.data.content : [];
        if (live) setLegacy(list.filter((iv) => iv && iv.scheduledDate && iv.interviewStatus !== "CANCELLED").map(fromLegacy));
      })
      .catch(() => {});
    // Application deadlines of the drives open to them, for the calendar.
    Api.get(`/api/v1/jobs/all/${learnerId}`)
      .then((r) => {
        const list = Array.isArray(r?.data?.data) ? r.data.data : [];
        if (live) setDeadlines(list.filter((j) => j?.isVisible !== false && j.applicationDeadline).map((j) => ({ jobId: j.id, at: j.applicationDeadline, title: `Apply: ${j.companyName}`, role: j.jobTitle })));
      })
      .catch(() => {});
    return () => { live = false; };
  }, [learnerId, organizationId]);

  // The college's blocked (exam) dates for the month on screen.
  useEffect(() => {
    if (!learnerId || view !== "month") return undefined;
    let live = true;
    const start = month.clone().startOf("month").startOf("week");
    const end = month.clone().endOf("month").endOf("week");
    getStudentCalendarExtras(start.format("YYYY-MM-DDTHH:mm:ss"), end.format("YYYY-MM-DDTHH:mm:ss"))
      .then((r) => { if (live) setBlocked((Array.isArray(r?.data) ? r.data : []).filter((e) => e.type === "BLOCKED")); })
      .catch(() => {});
    return () => { live = false; };
  }, [learnerId, month, view]);

  const all = useMemo(() => {
    if (!journey) return [];
    // A drive from the older flow sends its test as a link on the application (no rounds): it is a test to take by its due date.
    const tests = journey.applications.filter((a) => a.live && a.assessmentUrl && /^https:\/\//.test(a.assessmentUrl) && !(a.rounds || []).length)
      .map((a) => ({
        roundId: `test-${a.applicationId}`, applicationId: a.applicationId, kind: "VENDOR_TEST", name: "Online assessment", company: a.company,
        role: a.role, jobId: a.jobId, logo: a.logo, startsAt: a.assessmentDeadline || null, testLink: a.assessmentUrl, live: true, booked: false, due: true,
      }));
    return [...journey.schedule, ...legacy, ...tests].sort((a, b) => (at(a.startsAt)?.valueOf() || 0) - (at(b.startsAt)?.valueOf() || 0));
  }, [journey, legacy]);

  const ahead = all.filter((s) => s.live && !isOver(s));
  const past = all.filter((s) => !ahead.includes(s) && at(s.startsAt)?.isBefore(moment())).reverse();

  if (!learnerId) return null;
  if (failed) return <Alert type="warning" showIcon message="We could not load your schedule" action={<Button size="small" onClick={reload}>Retry</Button>} />;
  if (loading && !journey) return <Skeleton active paragraph={{ rows: 8 }} />;

  // Apply-by dates only for drives they have not applied to.
  const applied = new Set((journey?.applications || []).map((a) => String(a.jobId)));
  const openDeadlines = deadlines.filter((d) => !applied.has(String(d.jobId)));
  const toConfirm = ahead.filter((s) => s.booked && !s.confirmedAt && s.kind !== "TALK" && s.moveAsk?.status !== "PENDING").length;

  return (
    <div data-testid="sp.schedule">
      <p className="sp-page-intro">Your tests, talks and interviews. When the placement cell books you, it shows here and you get a notice{toConfirm ? "; please confirm each one so they know you'll be there" : ""}.</p>
      <div className="sp-seg" role="group" aria-label="Show">
        {VIEWS.map(([k, label]) => (
          <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)}>
            {label}{k === "ahead" && ahead.length ? ` (${ahead.length})` : ""}
          </button>
        ))}
      </div>

      {toConfirm > 0 && view === "ahead" && (
        <Alert className="sp-gap" type="info" showIcon message={`${toConfirm === 1 ? "One round needs" : `${toConfirm} rounds need`} your confirmation`}
          description="Tap Confirm I'll attend on each. If you can't make it, ask to reschedule before the day." />
      )}

      {view === "ahead" && (ahead.length === 0 ? (
        <div className="sp-panel"><p className="sp-empty">Nothing coming up. When a company&apos;s round is planned and the placement cell books you, it shows here. <Link href="/learn/my-placements/applications">See where your applications stand</Link></p></div>
      ) : groupByDay(ahead).map((g) => (
        <section key={g.key} aria-label={g.label}>
          <h2 className="sp-day-head">{g.label}</h2>
          <div className="sp-stack">{g.items.map((s) => <ScheduleCard key={`${s.applicationId}-${s.roundId}`} item={s} onChanged={reload} />)}</div>
        </section>
      )))}

      {view === "past" && (past.length === 0 ? (
        <div className="sp-panel"><p className="sp-empty">No past rounds yet.</p></div>
      ) : (
        <div className="sp-stack">{past.map((s) => <ScheduleCard key={`${s.applicationId}-${s.roundId}`} item={s} onChanged={reload} />)}</div>
      ))}

      {view === "month" && (
        <MonthView month={month} setMonth={setMonth} events={all} deadlines={openDeadlines} blocked={blocked} onDay={setDayOpen} />
      )}

      <Drawer open={Boolean(dayOpen)} onClose={() => setDayOpen(null)} title={dayOpen ? dayOpen.format("dddd D MMMM") : ""} width={440}>
        {dayOpen && (() => {
          const evs = all.filter((s) => at(s.startsAt)?.isSame(dayOpen, "day"));
          const dl = openDeadlines.filter((d) => at(d.at)?.isSame(dayOpen, "day"));
          const bl = blocked.filter((b) => at(b.startsAt)?.isSame(dayOpen, "day"));
          return (
            <div className="sp-stack">
              {bl.map((b, i) => <Alert key={`b${i}`} type="error" message={b.title} description="The college has blocked this day. No drives run on it." />)}
              {evs.map((s) => <ScheduleCard key={`${s.applicationId}-${s.roundId}`} item={s} onChanged={reload} />)}
              {dl.map((d) => <div key={`d${d.jobId}`} className="sp-panel"><b>Applications close {dayTime(d.at)}</b><br /><Link href={`/learn/my-placements/jobs/${d.jobId}`}>{d.title.replace("Apply: ", "")} · {d.role}</Link></div>)}
              {!evs.length && !dl.length && !bl.length && <p className="sp-empty">Nothing on this day.</p>}
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}

function MonthView({ month, setMonth, events, deadlines, blocked, onDay }) {
  const start = month.clone().startOf("month").startOf("week");
  const days = Array.from({ length: 42 }, (_, i) => start.clone().add(i, "days"));
  const weeks = days[35].month() !== month.month() ? days.slice(0, 35) : days;
  const onDate = (list, get, d) => list.filter((x) => at(get(x))?.isSame(d, "day"));
  return (
    <section className="sp-panel sp-month" aria-label="Calendar">
      <div className="sp-month__bar">
        <Button aria-label="Previous month" icon={<LeftOutlined />} onClick={() => setMonth(month.clone().subtract(1, "month"))} />
        <h3>{month.format("MMMM YYYY")}</h3>
        <span>
          <Button size="small" onClick={() => setMonth(moment().startOf("month"))} style={{ marginRight: 6 }}>Today</Button>
          <Button aria-label="Next month" icon={<RightOutlined />} onClick={() => setMonth(month.clone().add(1, "month"))} />
        </span>
      </div>
      <div className="sp-month__grid" role="grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => <div key={w} className="sp-month__wd" role="columnheader">{w}</div>)}
        {weeks.map((d) => {
          const evs = onDate(events, (x) => x.startsAt, d);
          const dl = onDate(deadlines, (x) => x.at, d);
          const bl = blocked.filter((b) => at(b.startsAt)?.isSame(d, "day"));
          const cls = ["sp-month__cell", d.month() !== month.month() && "sp-month__cell--out", d.isSame(moment(), "day") && "sp-month__cell--today", bl.length && "sp-month__cell--blocked"].filter(Boolean).join(" ");
          return (
            <div key={d.format("YYYYMMDD")} className={cls} role="gridcell" aria-label={d.format("D MMMM")}>
              <span className="sp-month__num">{d.date()}</span>
              {bl.map((b, i) => <span key={`b${i}`} className="sp-month__ev sp-month__ev--blocked" title={b.title}>{b.title}</span>)}
              {evs.map((s) => (
                <button key={`${s.applicationId}-${s.roundId}`} type="button" onClick={() => onDay(d.clone())}
                  className={`sp-month__ev ${s.kind === "TALK" ? "sp-month__ev--talk" : ""} ${isPast(s.endsAt || s.startsAt) ? "sp-month__ev--done" : ""}`}
                  title={`${s.name} · ${s.company} · ${dayTime(s.startsAt)}`}>
                  {at(s.startsAt)?.format("h:mm")} {s.name} · {s.company}
                </button>
              ))}
              {dl.map((x) => (
                <button key={`d${x.jobId}`} type="button" onClick={() => onDay(d.clone())} className="sp-month__ev sp-month__ev--deadline" title={`${x.title} ${dayTime(x.at)}`}>
                  {x.title}
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <div className="sp-month__legend" aria-hidden="true">
        <span style={{ "--c": "#e6f6f8" }}>Your tests and interviews</span>
        <span style={{ "--c": "#eef2ff" }}>Talks</span>
        <span style={{ "--c": "rgba(217,119,6,0.18)" }}>Application deadlines</span>
        <span style={{ "--c": "rgba(180,35,24,0.15)" }}>No drives (exams)</span>
      </div>
    </section>
  );
}

SchedulePage.getLayout = (page) => PlacementsTabsLayout(page);
