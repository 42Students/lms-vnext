import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { Alert, Button, Card, Result, Tag, Typography } from "antd";
import { LeftOutlined, ReloadOutlined, RightOutlined } from "@ant-design/icons";
import moment from "moment";
import PageShell from "@/components/Common/PageShell";
import { ListSkeleton } from "@/components/Common/Skeletons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { appAction } from "@/redux/store";
import { getRecruiterCalendar } from "@/api/Services/RecruiterService";
import useRecruiterCollege from "@/components/recruiter/useRecruiterCollege";
import NoCollegeSession from "@/components/recruiter/NoCollegeSession";
import { driveHref } from "@/components/recruiter/recruiterRoutes";
import { foldWeek } from "@/components/recruiter/RecruiterToday";

const errorText = (e, fallback) => e?.response?.data?.message || e?.response?.data?.error || fallback;

export const EVENT_STYLE = {
  ROUND: { label: "Round", color: "blue" },
  SLOT: { label: "Interview slot", color: "green" },
  DEADLINE: { label: "Deadline", color: "orange" },
  RESULTS_DUE: { label: "Results due", color: "gold" },
};

/** Monday of the week containing `date`. */
export const weekStartOf = (date) => moment(date).startOf("isoWeek");

/** Seven days from `weekStart`, each with that day's events in time order. */
export function groupByDay(events, weekStart) {
  const days = Array.from({ length: 7 }, (_, i) => ({ date: moment(weekStart).add(i, "days"), events: [] }));
  (events || []).forEach((e) => {
    const idx = moment(e.start).startOf("day").diff(moment(weekStart).startOf("day"), "days");
    if (idx >= 0 && idx < 7) days[idx].events.push(e);
  });
  days.forEach((d) => d.events.sort((a, b) => String(a.start).localeCompare(String(b.start))));
  return days;
}

/** Everything dated across the recruiter's drives at this college, a week at a time. */
export default function RecruiterCalendarPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const college = useRecruiterCollege();
  const [weekStart, setWeekStart] = useState(() => weekStartOf(new Date()));
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(null);
  const latest = useRef(0);

  useEffect(() => { dispatch(appAction.setActiveMenuItem("calendar")); }, [dispatch]);

  // The week is asked for as exact instants (the viewer's local Monday 00:00 to the next one), and an answer that
  // arrives after the person has already moved to another week is ignored.
  const load = useCallback(() => {
    if (!college.collegeId) return;
    setError(null);
    const ticket = ++latest.current;
    getRecruiterCalendar(college.collegeId, weekStart.toISOString(), moment(weekStart).add(7, "days").toISOString())
      .then((r) => { if (ticket === latest.current) setEvents(Array.isArray(r?.data) ? r.data : []); })
      .catch((e) => { if (ticket === latest.current) setError(errorText(e, "Could not load the calendar")); });
  }, [college.collegeId, weekStart]);
  useEffect(() => { setEvents(null); load(); }, [load]);

  const days = useMemo(() => groupByDay(events, weekStart), [events, weekStart]);
  const today = moment();

  const shell = (node) => <div className="scroll-container recruiter-calendar recruiter-calendar--state"><PageShell>{node}</PageShell></div>;
  if (college.error) return shell(<Result status="warning" title="We couldn't load your account" extra={<Button icon={<ReloadOutlined />} onClick={college.reload}>Retry</Button>} />);
  if (college.needsCollege) return shell(<NoCollegeSession />);

  const total = (events || []).length;
  return (
    <div className="scroll-container recruiter-calendar" data-testid="recruiter.calendar">
      <PageShell>
        <ListingPageHeader
          className="recruiter-calendar__header"
          title="Calendar"
          rightContent={(
            <div className="recruiter-calendar__nav">
              <Button icon={<LeftOutlined />} aria-label="Previous week" onClick={() => setWeekStart(moment(weekStart).subtract(7, "days"))} />
              <Button onClick={() => setWeekStart(weekStartOf(new Date()))}>Today</Button>
              <Button icon={<RightOutlined />} aria-label="Next week" onClick={() => setWeekStart(moment(weekStart).add(7, "days"))} />
            </div>
          )}
        />
        <Typography.Text strong className="recruiter-calendar__range" data-testid="recruiter.calendar.range">{weekStart.format("D MMM")} to {moment(weekStart).add(6, "days").format("D MMM YYYY")}</Typography.Text>
        {error && <Alert className="recruiter-calendar__error" type="warning" showIcon message={error} action={<Button size="small" onClick={load}>Retry</Button>} />}
        {events === null && !error ? <ListSkeleton rows={7} avatar={false} label="Loading recruiter calendar" /> : (
          <>
            {total === 0 && !error && <Alert className="recruiter-calendar__empty" type="info" showIcon message="Nothing scheduled this week" description="Rounds, slots and deadlines appear here as soon as they are dated." data-testid="recruiter.calendar.empty" />}
            {/* A week with nothing in it is one message, not a message plus seven empty boxes. */}
            {/* An agenda, day by day, only the days with something on them: seven narrow columns turned one interview day into a tall
                stack of cards repeating the role and the room, and did not work on a phone (UX audit, 19 Oct 2026). A round's interview
                slots are one line ("4 interview slots"), as on Today. */}
            {total > 0 && <div className="recruiter-calendar__agenda">
              {days.filter((d) => d.events.length).map((d) => (
                <Card key={d.date.format("YYYY-MM-DD")} size="small" className={`recruiter-calendar__day ${d.date.isSame(today, "day") ? "recruiter-calendar__day--today" : ""}`} data-testid={`recruiter.calendar.day-${d.date.format("YYYY-MM-DD")}`}>
                  <Typography.Text strong className="recruiter-calendar__day-head">{d.date.format("dddd D MMM")}{d.date.isSame(today, "day") ? " · Today" : ""}</Typography.Text>
                  {foldWeek(d.events).map((e) => {
                    const st = EVENT_STYLE[e.type] || { label: e.type, color: "default" };
                    const href = e.jobId ? driveHref(e.jobId, e.type === "DEADLINE" ? "overview" : "rounds") : null;
                    return (
                      <div key={e.id} className="recruiter-calendar__event" role={href ? "button" : undefined} tabIndex={href ? 0 : undefined} onClick={() => href && router.push(href)}
                        aria-label={href ? `Open ${e.title || "event"}${e.jobTitle ? ` for ${e.jobTitle}` : ""}` : undefined}
                        onKeyDown={(ev) => {
                          // BE-0172: a role="button" answers Enter and Space, like a real button.
                          if (!href || (ev.key !== "Enter" && ev.key !== " ")) return;
                          ev.preventDefault();
                          router.push(href);
                        }}>
                        <span className="recruiter-calendar__time">{moment(e.start).format("h:mm A")}{e.end && !e.slots ? ` to ${moment(e.end).format("h:mm A")}` : ""}</span>
                        <span className="recruiter-calendar__what">
                          <Typography.Text strong>{e.title}</Typography.Text>
                          <Typography.Text type="secondary">{[e.jobTitle, e.where, e.slots ? `${e.slots} interview ${e.slots === 1 ? "slot" : "slots"}` : null].filter(Boolean).join(" · ")}</Typography.Text>
                        </span>
                        {e.type === "SLOT" && e.status === "PROPOSED" && <Tag color={st.color}>Waiting for the placement cell</Tag>}
                      </div>
                    );
                  })}
                </Card>
              ))}
            </div>}
          </>
        )}
      </PageShell>
    </div>
  );
}
