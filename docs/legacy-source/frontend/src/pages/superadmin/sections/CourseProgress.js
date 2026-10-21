import { useState, useEffect, useCallback, useRef } from "react";
import { Alert, Card, Col, Empty, Progress, Row, Select, Space, Statistic, Table, Typography, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { Button } from "antd";
import {
  fetchWithErrorHandling,
  getCoursesByCollege,
  getClassesByCollege,
  getCourseProgress,
} from "@/api/Services/AdminService";
import { getAssignmentsByClass } from "@/api/Services/FacultyAssignmentService";
import { exportRowsToCsv, columnsFromRows } from "@/utils/csvExport";
import { DashboardSkeleton, RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";

const { Text, Paragraph } = Typography;

/**
 * How far a class has got through a course.
 *
 * Course module audit, pass 2. The console could create courses, lessons and content, grade
 * assignments and export submissions — and could not answer the first question anyone asks about a
 * course in progress: is this class keeping up? The progress data existed per learner per content
 * item and was read only by the learner's own screens; there was no aggregate in any endpoint, so
 * the question had no product answer.
 *
 * Counts measured work only: videos completed (against their length), assignments submitted and
 * quizzes attempted. Resources are left out because "done" there is a learner's own click.
 *
 * Class first, then course: the course list is what that class is actually taught (teaching
 * assignments). Picking the two independently allowed any pairing, most of them meaningless.
 */
const CourseProgress = ({ collegeId }) => {
  const isScoped = collegeId != null && Number.isFinite(Number(collegeId)) && Number(collegeId) > 0;

  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courseId, setCourseId] = useState(null);
  const [classId, setClassId] = useState(null);
  const [data, setData] = useState(null);
  const [classCourses, setClassCourses] = useState(null); // null = unknown, fall back to all courses
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState(null);
  // BE-0131: the filters' Retry. BE-0132: whether the class's own course list failed (then no course can be picked).
  const [metadataRetry, setMetadataRetry] = useState(0);
  const [classCoursesFailed, setClassCoursesFailed] = useState(false);
  const [classCoursesRetry, setClassCoursesRetry] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  const [errorScopeKey, setErrorScopeKey] = useState(null);
  const progressScopeKey = courseId && classId ? `${collegeId}:${classId}:${courseId}` : null;
  const hasCurrentData = progressScopeKey != null && loadedScopeKey === progressScopeKey && data != null;
  const currentError = errorScopeKey === progressScopeKey ? error : null;
  const initialLoading = Boolean(progressScopeKey && loading && !hasCurrentData);
  const refreshing = Boolean(progressScopeKey && loading && hasCurrentData);

  useEffect(() => {
    if (!isScoped) {
      setCourses([]);
      setClasses([]);
      setMetadataLoading(false);
      setMetadataError(null);
      return undefined;
    }
    let cancelled = false;
    setMetadataLoading(true);
    setMetadataError(null);
    // A college switch is a new scope. Never leave the previous college's selection/data visible
    // while the new metadata request is pending.
    setClassId(null);
    setCourseId(null);
    setClassCourses(null);
    setData(null);
    setLoadedScopeKey(null);
    setError(null);
    setErrorScopeKey(null);
    (async () => {
      const [c, k] = await Promise.all([
        fetchWithErrorHandling(getCoursesByCollege(collegeId)),
        fetchWithErrorHandling(getClassesByCollege(collegeId)),
      ]);
      if (cancelled) return;
      const courseRows = c.success ? (c.data?.data ?? c.data ?? []) : [];
      const classRows = k.success ? (k.data?.data ?? k.data ?? []) : [];
      setCourses(Array.isArray(courseRows) ? courseRows : []);
      setClasses(Array.isArray(classRows) ? classRows : []);
      if (!c.success || !k.success) {
        setMetadataError("Some course-progress filters could not be loaded. Retry before selecting a class.");
      }
      setMetadataLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [collegeId, isScoped, metadataRetry]);

  useEffect(() => {
    setClassCourses(null);
    setClassCoursesFailed(false);
    setCourseId(null);
    setData(null);
    setLoadedScopeKey(null);
    setError(null);
    setErrorScopeKey(null);
    if (!classId) return undefined;
    let cancelled = false;
    getAssignmentsByClass(classId)
      .then((res) => {
        if (cancelled) return;
        const rows = res?.data?.data ?? res?.data ?? [];
        if (!Array.isArray(rows)) { setClassCoursesFailed(true); return; }
        const byCourse = new Map();
        rows.forEach((row) => {
          if (row?.courseId == null) return;
          const prev = byCourse.get(row.courseId);
          if (!prev || (row.isActive && !prev.isActive)) byCourse.set(row.courseId, row);
        });
        const list = [...byCourse.values()]
          .sort((a, b) => Number(Boolean(b.isActive)) - Number(Boolean(a.isActive)) || (b.semesterNumber ?? 0) - (a.semesterNumber ?? 0))
          .map((row) => ({ value: row.courseId,
            label: `${row.courseName || `Course ${row.courseId}`}${row.semesterNumber ? ` · Sem ${row.semesterNumber}` : ""}${row.isActive ? "" : " · past"}` }));
        setClassCourses(list);
        setCourseId((current) => (current != null && list.length && !list.some((o) => o.value === current) ? null : current));
      })
      .catch(() => { if (!cancelled) { setClassCourses(null); setClassCoursesFailed(true); } });
    return () => { cancelled = true; };
  }, [classId, classCoursesRetry]);

  // CA-H01: once a class is chosen, only courses taught in it (the server refuses any other). BE-0132: while that list
  // loads, or if it failed, nothing is offered: the college's whole course list would offer pairs the server refuses.
  const courseSelectOptions = classId
    ? (Array.isArray(classCourses) ? classCourses : [])
    : courses.map((c) => ({ value: c.id, label: c.courseName || c.course_name || `Course ${c.id}` }));
  const classHasNoCourses = Boolean(classId) && Array.isArray(classCourses) && classCourses.length === 0;

  // BE-0129: only the newest request (the class and course picked now) may set the results or the error.
  const progressSeq = useRef(0);
  const load = useCallback(async () => {
    const seq = ++progressSeq.current;
    if (!courseId || !classId || !progressScopeKey) return;
    const requestScopeKey = progressScopeKey;
    setLoading(true);
    setError(null);
    setErrorScopeKey(null);
    try {
      const res = await getCourseProgress(courseId, classId);
      if (seq !== progressSeq.current) return;
      const nextData = res?.data?.data ?? res?.data ?? null;
      setData(nextData);
      setLoadedScopeKey(requestScopeKey);
    } catch (e) {
      if (seq !== progressSeq.current) return;
      setError(e?.response?.data?.message || e?.message || "Could not load course progress.");
      setErrorScopeKey(requestScopeKey);
      // A same-scope refresh failure keeps the last successful data. A new course/class scope
      // has no current data and renders its own error state instead of stale rows.
    } finally {
      if (seq === progressSeq.current) setLoading(false);
    }
  }, [courseId, classId, progressScopeKey]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { title: "Student", dataIndex: "name", key: "name", render: (v, r) => v || `Student #${r.learnerId}` },
    { title: "Roll number", dataIndex: "rollNumber", key: "rollNumber", render: (v) => v || "—" },
    {
      title: "Videos",
      key: "videos",
      width: 90,
      render: (_, r) => `${r.videosCompleted ?? r.completed ?? 0}/${data?.measuredItemCount ?? 0}`,
    },
    {
      title: "Assignments",
      key: "assignments",
      width: 110,
      render: (_, r) => `${r.assignmentsSubmitted ?? 0}/${data?.assignmentCount ?? 0}`,
    },
    {
      title: "Quizzes",
      key: "quizzes",
      width: 90,
      render: (_, r) => `${r.quizzesAttempted ?? 0}/${data?.quizCount ?? 0}`,
    },
    {
      title: "Progress",
      dataIndex: "percent",
      key: "percent",
      width: 220,
      sorter: (a, b) => a.percent - b.percent,
      defaultSortOrder: "ascend",
      render: (v) => (
        <Progress
          percent={v}
          size="small"
          // Colour is a prompt to look, not a verdict — the thresholds are deliberately generous
          // because "behind" depends on how far into the term the class is, which this screen
          // does not know.
          status={v === 0 ? "exception" : v < 40 ? "active" : "normal"}
        />
      ),
    },
  ];

  const handleExport = () => {
    if (!data?.learners?.length) return;
    // exportRowsToCsv(filename, columns, rows) needs a {label,key}[] columns list — this used to
    // call it with only (filename, rows), silently passing the row array in as `columns` and
    // leaving `rows` undefined.
    const rows = data.learners.map((l) => ({
      learnerId: l.learnerId,
      name: l.name,
      rollNumber: l.rollNumber || "",
      videos: l.videosCompleted ?? l.completed,
      videoTotal: data.measuredItemCount,
      assignments: l.assignmentsSubmitted ?? 0,
      assignmentTotal: data.assignmentCount ?? 0,
      quizzes: l.quizzesAttempted ?? 0,
      quizTotal: data.quizCount ?? 0,
      percent: l.percent,
    }));
    exportRowsToCsv(`course-progress-${courseId}-class-${classId}.csv`, columnsFromRows(rows), rows);
  };

  if (!isScoped) {
    return <Alert type="warning" showIcon message="Select a college to view course progress." />;
  }

  return (
    <div>
      <div className="admin-list-page__header">
        <div>
          <h1 className="admin-list-page__title">Course Progress</h1>
          <div className="admin-list-page__subtitle">See measured completion for a class and course, then focus on the students furthest behind.</div>
        </div>
      </div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Measured work only"
        description="Progress counts videos watched to the end, assignments submitted and quizzes attempted. Resources are not counted, because they are marked done by the student's own click."
      />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={9}>
            <Select
              style={{ width: "100%" }}
              placeholder="Class"
              value={classId}
              onChange={setClassId}
              loading={metadataLoading}
              disabled={metadataLoading}
              showSearch
              optionFilterProp="label"
              options={classes.map((c) => ({
                value: c.id,
                label: c.className || c.name || `Class ${c.id}`,
              }))}
            />
          </Col>
          <Col xs={24} md={9}>
            <Select
              style={{ width: "100%" }}
              placeholder={classCoursesFailed ? "Couldn't load this class's courses" : classHasNoCourses ? "No courses are taught in this class" : classId && !Array.isArray(classCourses) ? "Loading courses…" : classId ? "Course" : "Pick a class first"}
              notFoundContent={classHasNoCourses ? "No course is assigned to this class yet. Assign one under Teaching assignments." : undefined}
              disabled={!classId || metadataLoading || !Array.isArray(classCourses)}
              value={courseId}
              onChange={(value) => {
                setCourseId(value);
                setData(null);
                setLoadedScopeKey(null);
                setError(null);
                setErrorScopeKey(null);
              }}
              showSearch
              optionFilterProp="label"
              options={courseSelectOptions}
            />
          </Col>
          <Col xs={24} md={6}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={load} loading={loading} disabled={!courseId || !classId}>
                Refresh
              </Button>
              <Button onClick={handleExport} disabled={!data?.learners?.length}>
                Export CSV
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {metadataError ? (
        <Alert
          type="warning"
          showIcon
          message={metadataError}
          action={<Button size="small" onClick={() => setMetadataRetry((n) => n + 1)} loading={metadataLoading}>Retry</Button>}
          style={{ marginBottom: 16 }}
          data-testid="course-progress-metadata-error"
        />
      ) : null}
      {classCoursesFailed ? (
        <Alert
          type="warning"
          showIcon
          message="The courses taught in this class couldn't be loaded, so a course can't be picked yet."
          action={<Button size="small" onClick={() => setClassCoursesRetry((n) => n + 1)}>Retry</Button>}
          style={{ marginBottom: 16 }}
          data-testid="course-progress-class-courses-error"
        />
      ) : null}
      {refreshing ? <RefreshStatus label="Refreshing course progress…" /> : null}
      {currentError ? (
        <Alert
          type={hasCurrentData ? "warning" : "error"}
          showIcon
          message={hasCurrentData ? "Couldn't refresh course progress" : currentError}
          description={hasCurrentData ? "Showing the last progress loaded for this class and course." : undefined}
          action={<Button size="small" onClick={load}>Retry</Button>}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      {metadataLoading && classes.length === 0 && courses.length === 0 ? (
        <DashboardSkeleton metrics={4} label="Loading course progress filters" />
      ) : !courseId || !classId ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Pick a class, then one of its courses." />
      ) : initialLoading ? (
        <>
          <DashboardSkeleton metrics={4} label="Loading course progress summary" />
          <TableSkeleton rows={8} columns={6} label="Loading learner progress" />
        </>
      ) : currentError && !hasCurrentData ? null : data?.note ? (
        <Alert type="warning" showIcon message={data.note} />
      ) : hasCurrentData ? (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic title="Average completion" value={data?.averagePercent ?? 0} suffix="%" />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic title="Students" value={data?.learnerCount ?? 0} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Not started"
                  value={data?.notStartedCount ?? 0}
                  valueStyle={data?.notStartedCount ? { color: "#cf1322" } : undefined}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                {/* The breakdown used to be the Statistic's suffix, glued to the total: 25 items +
                    "17 videos" read as "2517 videos". */}
                <Statistic title="Items measured" value={data?.totalItemCount ?? data?.measuredItemCount ?? 0} />
                <Text type="secondary" style={{ fontSize: 12 }}>{data?.measuredItemCount ?? 0} videos · {data?.assignmentCount ?? 0} assignments · {data?.quizCount ?? 0} quizzes</Text>
              </Card>
            </Col>
          </Row>

          <Card size="small" title="Per student">
            <Paragraph type="secondary" style={{ marginTop: 0 }}>
              Sorted furthest-behind first, which is the order worth acting on.{" "}
              <Text type="secondary">
                A student retaking the course counts only their current attempt.
              </Text>
            </Paragraph>
            <Table
              size="small"
              rowKey="learnerId"
              columns={columns}
              dataSource={data?.learners || []}
              pagination={{ pageSize: 20, showSizeChanger: true }}
              scroll={{ x: "max-content" }}
              locale={{ emptyText: "No students in this section." }}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default CourseProgress;
