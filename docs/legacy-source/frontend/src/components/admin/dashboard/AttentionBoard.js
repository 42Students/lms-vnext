import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { Button, Card, Col, Empty, Row, Skeleton, Tag, Tooltip } from "antd";
import {
  CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  FormOutlined, ReloadOutlined, TeamOutlined, ToolOutlined, WarningOutlined,
} from "@ant-design/icons";
import { getAdminCollegeDashboard } from "@/api/Services/AdminService";
import { parseServerTimestamp } from "@/components/admin/projects/adminProjectUtils";

/**
 * "What needs me today" for a college admin. Each card is one question with the list behind it and
 * a link to the page where it gets fixed. A card whose query failed says so; a card with nothing to
 * do says that too — an empty dashboard must read as "all clear", never as "broken".
 */

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
// Server times arrive as epoch millis, a Jackson array or an ISO string; arrays are UTC.
const asDate = (value) => (typeof value === "number" ? dayjs(value) : dayjs(parseServerTimestamp(value)?.date));
const when = (value) => (value ? dayjs(String(value).replace(" ", "T")).format("ddd D MMM, h:mm A") : "");

function AttentionCard({ title, icon, count, tone = "warn", loading, failed, empty, footer, children }) {
  const clear = !loading && !failed && (count === 0 || count == null);
  return (
    <Card
      size="small"
      className={`admin-dash-attention admin-dash-attention--${failed ? "failed" : clear ? "clear" : tone}`}
      title={
        <span className="admin-dash-attention__title">
          <span className="admin-dash-attention__icon" aria-hidden="true">{icon}</span>
          {title}
        </span>
      }
      extra={!loading && !failed && count != null ? <span className="admin-dash-attention__count">{count}</span> : null}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 3 }} title={false} />
      ) : failed ? (
        <div className="admin-dash-attention__muted">Couldn&apos;t load this. Refresh to try again.</div>
      ) : clear ? (
        <div className="admin-dash-attention__clear"><CheckCircleOutlined aria-hidden="true" /> {empty}</div>
      ) : (
        children
      )}
      {footer && !loading && !failed && !clear ? <div className="admin-dash-attention__footer">{footer}</div> : null}
    </Card>
  );
}

// `total` is the card's full count. The server sends only the first few rows, so say how many
// more there are; "Courses with no teacher: 20" listing 8 rows read as if 8 were all of them.
function Rows({ items, render, total }) {
  const safeItems = Array.isArray(items) ? items.filter((item) => item && typeof item === "object") : [];
  const more = Number.isFinite(total) ? total - safeItems.length : 0;
  return (
    <ul className="admin-dash-attention__list">
      {safeItems.map((item, index) => (
        <li key={index} className="admin-dash-attention__row">{render(item)}</li>
      ))}
      {more > 0 ? <li className="admin-dash-attention__row admin-dash-attention__muted">and {more} more</li> : null}
    </ul>
  );
}

export default function AttentionBoard({ collegeId, basePath = "/college-admin" }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const loadedCollegeIdRef = useRef(null);
  const loadInFlightRef = useRef(false);

  const load = useCallback(() => {
    if (!collegeId || loadInFlightRef.current) return undefined;
    let cancelled = false;
    const sameScope = loadedCollegeIdRef.current === collegeId;
    if (!sameScope) setData(null);
    loadInFlightRef.current = true;
    setLoading(true);
    setError(false);
    getAdminCollegeDashboard(collegeId)
      .then((res) => {
        if (cancelled) return;
        const next = res?.data?.data ?? res?.data ?? null;
        setData(next && typeof next === "object" ? next : {});
        loadedCollegeIdRef.current = collegeId;
      })
      .catch(() => {
        if (cancelled) return;
        if (!sameScope) setData(null);
        setError(true);
      })
      .finally(() => {
        loadInFlightRef.current = false;
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [collegeId]);

  useEffect(() => load(), [load]);

  if (!collegeId) return null;
  if (error && !loading && !data) {
    return (
      <section className="admin-dashboard-section">
        <Empty description="Couldn't load today's overview.">
          <Button icon={<ReloadOutlined />} onClick={load}>Retry</Button>
        </Empty>
      </section>
    );
  }

  const today = data?.today;
  const pending = data?.attendancePending;
  const risk = data?.attendanceAtRisk;
  const grading = data?.gradingBacklog;
  const unstaffed = data?.unstaffed;
  const gaps = data?.setupGaps;
  const due = data?.dueThisWeek;
  const threshold = data?.attendanceThreshold ?? 75;
  const gapTotal = gaps ? (gaps.batchesWithoutClasses || 0) + (gaps.sectionsWithoutStudents || 0)
    + (gaps.studentsWithoutClass || 0) + (gaps.coursesWithoutLessons || 0) : null;
  const sectionFailed = (key) => !loading && data != null && data[key] == null;

  return (
    <section className="admin-dashboard-section admin-dash-board" aria-label="Needs attention">
      <div className="admin-dash-board__head">
        <h2 className="admin-dashboard-section__title">Today</h2>
        <Button size="small" type="text" icon={<ReloadOutlined />} onClick={load} loading={loading}>Refresh</Button>
      </div>
      {error && data ? (
        <div className="admin-dash-attention__muted" role="status" style={{ marginBottom: 12 }}>
          Refresh failed. Showing the last overview loaded for this college.
        </div>
      ) : null}

      <div className="admin-dash-today" aria-label="Today's classes">
        {loading ? <Skeleton active paragraph={false} /> : today ? (
          <>
            <span><strong>{today.classCount}</strong> {today.classCount === 1 ? "class" : "classes"} scheduled today</span>
            <span><strong>{today.heldCount}</strong> held so far</span>
            <span className={today.heldCount > today.markedCount ? "admin-dash-today__warn" : ""}>
              <strong>{today.markedCount}</strong> with attendance taken
            </span>
          </>
        ) : <span className="admin-dash-attention__muted">Today&apos;s classes couldn&apos;t be loaded.</span>}
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12} xl={8}>
          <AttentionCard title="Attendance not taken" icon={<ClockCircleOutlined />} tone="danger"
            loading={loading} failed={sectionFailed("attendancePending")} count={pending?.count}
            empty="Every class held in the last 7 days has attendance."
            footer={<Link href={`${basePath}/attendance`}>Open attendance</Link>}>
            <Rows items={pending?.items || []} total={pending?.count} render={(r) => (
              <>
                <span className="admin-dash-attention__main">{r.courseName || r.title || "Class session"} · {r.className}</span>
                <span className="admin-dash-attention__sub">{when(r.startTime)}{r.facultyName ? ` · ${r.facultyName}` : " · no faculty set"}</span>
              </>
            )} />
          </AttentionCard>
        </Col>

        <Col xs={24} lg={12} xl={8}>
          <AttentionCard title={`Under ${threshold}% attendance`} icon={<WarningOutlined />} tone="danger"
            loading={loading} failed={sectionFailed("attendanceAtRisk")} count={risk?.count}
            empty={`No student is under ${threshold}% in the last 30 days.`}
            footer={<span>Last 30 days, marked sessions only · <Link href={`${basePath}/attendance`}>Attendance</Link></span>}>
            <Rows items={risk?.items || []} total={risk?.count} render={(r) => (
              <>
                <span className="admin-dash-attention__main">{r.name || `Student ${r.learnerId}`}{r.rollNumber ? ` · ${r.rollNumber}` : ""}</span>
                <span className="admin-dash-attention__sub">
                  <Tag color="red">{r.percent}%</Tag>{r.className} · {r.held - r.absent} of {plural(r.held, "session")}
                </span>
              </>
            )} />
          </AttentionCard>
        </Col>

        <Col xs={24} lg={12} xl={8}>
          <AttentionCard title="Waiting to be graded" icon={<FormOutlined />}
            loading={loading} failed={sectionFailed("gradingBacklog")} count={grading?.count}
            empty="No assignment submission is waiting for a grade."
            footer={<span>{grading?.oldestSubmittedAt ? `Oldest from ${asDate(grading.oldestSubmittedAt).format("D MMM YYYY")} · ` : ""}<Link href={`${basePath}/assignments`}>Assignments</Link></span>}>
            <Rows items={grading?.items || []} render={(r) => (
              <>
                <span className="admin-dash-attention__main">{r.courseName || `Course ${r.courseId}`}</span>
                <span className="admin-dash-attention__sub">{plural(Number(r.count), "submission")} · oldest {asDate(r.oldestSubmittedAt).format("D MMM")}</span>
              </>
            )} />
          </AttentionCard>
        </Col>

        <Col xs={24} lg={12} xl={8}>
          <AttentionCard title="Courses with no teacher" icon={<TeamOutlined />}
            loading={loading} failed={sectionFailed("unstaffed")} count={unstaffed?.count}
            empty="Every current-semester course has a teacher for every section."
            footer={<span>Students see these with nobody behind them · <Link href={`${basePath}/faculty-assignment`}>Faculty assignment</Link></span>}>
            <Rows items={unstaffed?.items || []} total={unstaffed?.count} render={(r) => (
              <>
                <span className="admin-dash-attention__main">{r.courseName}</span>
                <span className="admin-dash-attention__sub">{r.className} · Semester {r.semester}</span>
              </>
            )} />
          </AttentionCard>
        </Col>

        <Col xs={24} lg={12} xl={8}>
          <AttentionCard title="Setup gaps" icon={<ToolOutlined />}
            loading={loading} failed={sectionFailed("setupGaps")} count={gapTotal}
            empty="Batches, sections, students and courses are all connected.">
            <Rows items={[
              { n: gaps?.batchesWithoutClasses, label: "active batch with no classes", many: "active batches with no classes", href: "classes" },
              { n: gaps?.sectionsWithoutStudents, label: "section with no students", many: "sections with no students", href: "students" },
              { n: gaps?.studentsWithoutClass, label: "student not in any class", many: "students not in any class", href: "students" },
              { n: gaps?.coursesWithoutLessons, label: "course with no lessons", many: "courses with no lessons", href: "courses" },
            ].filter((g) => g.n > 0)} render={(g) => (
              <Link href={`${basePath}/${g.href}`} className="admin-dash-attention__main">{g.n} {g.n === 1 ? g.label : g.many}</Link>
            )} />
          </AttentionCard>
        </Col>

        <Col xs={24} lg={12} xl={8}>
          <AttentionCard title="Quizzes closing this week" icon={<CalendarOutlined />} tone="info"
            loading={loading} failed={sectionFailed("dueThisWeek")} count={due?.quizCount}
            empty="No quiz closes in the next 7 days."
            footer={<Link href={`${basePath}/quizzes`}>Quizzes</Link>}>
            <Rows items={due?.items || []} total={due?.quizCount} render={(r) => (
              <>
                <span className="admin-dash-attention__main">{r.title || `Quiz ${r.quizId}`}</span>
                <span className="admin-dash-attention__sub">
                  <Tooltip title={r.className ? `Only ${r.className}` : "All sections taking the course"}>
                    {r.courseName}{r.className ? ` · ${r.className}` : ""}
                  </Tooltip>{" "}· closes {when(r.dueAt)}
                </span>
              </>
            )} />
          </AttentionCard>
        </Col>
      </Row>
      {!loading && data && [pending, risk, grading, unstaffed].every((s) => s && !s.count) && gapTotal === 0 ? (
        <p className="admin-dash-board__allclear"><CheckCircleOutlined aria-hidden="true" /> Nothing needs you right now.</p>
      ) : null}
    </section>
  );
}
