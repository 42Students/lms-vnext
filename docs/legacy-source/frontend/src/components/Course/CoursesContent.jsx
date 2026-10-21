import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { Empty, Tag, Button, Input, Select, Popover, Segmented } from "antd";
import { BookOutlined, ReloadOutlined, TeamOutlined, StarOutlined, SearchOutlined, CalendarOutlined, FilterOutlined } from "@ant-design/icons";
import { getStudentCoursesBySemester, getLearnerSemesters } from "@/api/Services/SemesterService";
import { getActiveAssignmentsByFaculty } from "@/api/Services/FacultyAssignmentService";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import PageShell from "@/components/Common/PageShell";
import { SkeletonText } from "@/components/Common/Skeletons";
import MetricPill from "@/components/Global/MetricPill/MetricPill";
import { loginUserAction } from "@/redux/store";
import {
  FALLBACK_IMAGE, courseHref, sectionKey, searchCourses, filterByCourseType, safeCredits,
  normalizedLearnerCourses, normalizedFacultyCourses, academicConfigurationMessage,
} from "@/utils/courseListingUtils";
import { learnerAvailability } from "@/utils/courseUtils/contentAvailability";

const PAGE_SIZE = 48;

function CourseImage({ src, alt }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const validSrc = typeof src === "string" && src.trim() ? src : FALLBACK_IMAGE;
  const effectiveSrc = failed ? FALLBACK_IMAGE : validSrc;
  return (
    <Image src={effectiveSrc} alt={alt} width={400} height={140}
      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
      unoptimized={effectiveSrc === FALLBACK_IMAGE}
      onLoad={(event) => event.target.classList.add("img-loaded")}
      onError={() => { if (!failed) setFailed(true); }} />
  );
}

/** Shared, identity-scoped Faculty and Learner All Courses listing. */
export default function CoursesContent({ basePath = "/learn", showHeader = true, isTeacher: isTeacherProp }) {
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const isTeacher = isTeacherProp ?? loginUser?.userType === "FACULTY";
  const userId = loginUser?.id;
  const loggedIn = !!loginUser?.isUserLoggedIn;
  const identity = [isTeacher ? "faculty" : "learner", loggedIn, userId ?? "",
    loginUser?.userType ?? "", loginUser?.collegeId ?? "", loginUser?.organizationId ?? "",
    loginUser?.classId ?? ""].join(":");
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const courseRequest = useRef({ number: 0, controller: null });
  const semesterRequest = useRef({ number: 0, controller: null });
  const confirmedSemesterIdRef = useRef(null);

  const [courses, setCourses] = useState([]);
  const [semesterInfo, setSemesterInfo] = useState(null);
  const [resultIdentity, setResultIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  // The semester whose switch failed, so the inline message can retry exactly that one.
  const [failedSemesterId, setFailedSemesterId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseTypeFilter, setCourseTypeFilter] = useState("all");
  // #1: once a faculty member teaches enough sections/classes (electives adds more of them), the
  // list needs a way to narrow down to one -- "all" shows everything, same default as the
  // learner's own type filter.
  const [sectionFilter, setSectionFilter] = useState("all");
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [semestersLoading, setSemestersLoading] = useState(false);
  const [semestersError, setSemestersError] = useState(null);

  const activateCourse = useCallback((course) => {
    const identifier = course?.slug || course?.id;
    if (identifier == null || String(identifier).trim() === "") return;
    const payload = { CourseID: String(identifier) };
    if (course?.clsid != null && String(course.clsid).trim() !== "") {
      payload.classId = String(course.clsid);
    }
    dispatch(loginUserAction.handleUserData(payload));
  }, [dispatch]);

  const loadCourses = useCallback((semesterId, { preserveCurrent = false } = {}) => {
    courseRequest.current.controller?.abort();
    const number = courseRequest.current.number + 1;
    const controller = new AbortController();
    courseRequest.current = { number, controller };
    const current = () => courseRequest.current.number === number &&
      identityRef.current === identity && !controller.signal.aborted;

    // Initial/identity loads need a clean slate. In-context refetches (for example,
    // switching semester) keep the current cards visible until the replacement data
    // succeeds, so a filter change never turns the whole page back into a skeleton.
    if (!preserveCurrent) {
      setCourses([]);
      setSemesterInfo(null);
      setResultIdentity(null);
      setRefreshing(false);
    }
    setFetchError(null);
    setRefreshError(null);
    setVisibleLimit(PAGE_SIZE);
    if (!loggedIn || !userId) {
      setLoading(false);
      setRefreshing(false);
      setFetchError("Please sign in to view your courses.");
      return;
    }
    if (isTeacher && loginUser?.userType !== "FACULTY") {
      setLoading(false);
      setRefreshing(false);
      setFetchError("Faculty access is required to view teaching assignments.");
      return;
    }
    if (preserveCurrent) setRefreshing(true);
    else setLoading(true);
    const pending = isTeacher
      ? getActiveAssignmentsByFaculty(userId, { signal: controller.signal })
      : getStudentCoursesBySemester(userId, { signal: controller.signal, semesterId });
    Promise.resolve(pending).then((response) => {
      if (!current()) return;
      const data = response?.data?.data ?? response?.data;
      if (isTeacher) {
        if (!Array.isArray(data)) throw new Error("Invalid Faculty course response");
        setCourses(normalizedFacultyCourses(data));
        setSemesterInfo(null);
      } else {
        if (!data || typeof data !== "object" || !Array.isArray(data.courses)) {
          throw new Error("Invalid Learner course response");
        }
        setCourses(
          normalizedLearnerCourses(data, loginUser?.classId)
            .filter((course) => course?.invalidRecord || learnerAvailability(course).visible)
        );
        const resolvedSemesterId = data.semester_id ?? semesterId ?? null;
        setSemesterInfo({
          semesterId: resolvedSemesterId,
          currentSemester: data.current_semester,
          semesterName: data.semester_name,
          programName: data.program_name,
          batchName: data.batch_name,
          academicYear: data.academic_year,
          classId: data.class_id,
          batchId: data.batch_id,
          programId: data.program_id,
          configurationStatus: data.configuration_status,
          fallbackApplied: data.semester_fallback_applied === true,
        });
        if (resolvedSemesterId != null) {
          confirmedSemesterIdRef.current = resolvedSemesterId;
          setSelectedSemesterId(resolvedSemesterId);
        }
      }
      setResultIdentity(identity);
    }).catch((error) => {
      if (!current() || error?.name === "AbortError" || error?.code === "ERR_CANCELED") return;
      const status = error?.response?.status;
      const message = status === 401 ? "Your session has expired. Please sign in again."
        : status === 403 ? "You do not have permission to view these courses."
        : "Failed to load courses. Please try again.";

      if (preserveCurrent) {
        setFailedSemesterId(status === 401 || status === 403 ? null : semesterId);
        setRefreshError(status === 401 || status === 403
          ? message
          : "Could not load the selected semester. Your previous courses are still shown.");
        if (confirmedSemesterIdRef.current != null) {
          setSelectedSemesterId(confirmedSemesterIdRef.current);
        }
      } else {
        setCourses([]);
        setSemesterInfo(null);
        setResultIdentity(null);
        setFetchError(message);
      }
    }).finally(() => {
      if (!current()) return;
      if (preserveCurrent) setRefreshing(false);
      else setLoading(false);
    });
  }, [identity, isTeacher, loggedIn, userId, loginUser?.classId, loginUser?.userType]);

  const loadSemesters = useCallback(() => {
    semesterRequest.current.controller?.abort();
    const number = semesterRequest.current.number + 1;
    const controller = new AbortController();
    semesterRequest.current = { number, controller };
    const current = () => semesterRequest.current.number === number &&
      identityRef.current === identity && !controller.signal.aborted;
    setSemestersError(null);
    if (isTeacher || !loggedIn || !userId) {
      setAvailableSemesters([]);
      setSemestersLoading(false);
      return;
    }
    setSemestersLoading(true);
    getLearnerSemesters(userId, { signal: controller.signal }).then((response) => {
      if (!current()) return;
      const data = response?.data?.data ?? response?.data;
      if (!Array.isArray(data)) throw new Error("Invalid semesters response");
      setAvailableSemesters(data);
    }).catch((error) => {
      if (!current() || error?.name === "AbortError" || error?.code === "ERR_CANCELED") return;
      setAvailableSemesters([]);
      setSemestersError(error?.response?.status === 401
        ? "Session expired. Please sign in again." : "Could not load semesters.");
    }).finally(() => { if (current()) setSemestersLoading(false); });
  }, [identity, isTeacher, loggedIn, userId]);

  useEffect(() => {
    setCourses([]);
    setSemesterInfo(null);
    setResultIdentity(null);
    setSearchQuery("");
    setCourseTypeFilter("all");
    setSectionFilter("all");
    setVisibleLimit(PAGE_SIZE);
    setSelectedSemesterId(null);
    confirmedSemesterIdRef.current = null;
    setRefreshing(false);
    setRefreshError(null);
    setAvailableSemesters([]);
    loadCourses(null);
    loadSemesters();
    return () => {
      courseRequest.current.controller?.abort();
      courseRequest.current.number += 1;
      semesterRequest.current.controller?.abort();
      semesterRequest.current.number += 1;
    };
  }, [identity, loadCourses, loadSemesters]);

  useEffect(() => {
    if (selectedSemesterId != null || !semesterInfo || !availableSemesters.length) return;
    const matched = availableSemesters.find((semester) => semester.id === semesterInfo.semesterId)
      || availableSemesters.find((semester) => semester.semester_number === semesterInfo.currentSemester);
    if (matched) setSelectedSemesterId(matched.id);
  }, [availableSemesters, semesterInfo, selectedSemesterId]);

  // BE-0010: a learner looking at another semester sees its courses but can't open them (the course page opens only for
  // the current semester, an override or a live elective; it answered "not available" after the click).
  const viewedSemester = availableSemesters.find((semester) => semester.id === (selectedSemesterId ?? semesterInfo?.semesterId));
  const offCurrentSemester = !isTeacher && semesterInfo?.currentSemester != null && viewedSemester != null
    && Number(viewedSemester.semester_number) !== Number(semesterInfo.currentSemester);
  const OFF_SEMESTER_TEXT = "Not your current semester: shown for reference";
  const cardHref = (course) => (offCurrentSemester ? null : courseHref(basePath, course, isTeacher));

  const handleSemesterChange = useCallback((id) => {
    setRefreshError(null);
    setFailedSemesterId(null);
    setSearchQuery(""); // Old semester search must not conceal valid new semester cards.
    setVisibleLimit(PAGE_SIZE);
    setSelectedSemesterId(id);
    loadCourses(id, { preserveCurrent: true });
  }, [loadCourses]);
  const retryCourses = useCallback(() => loadCourses(isTeacher ? null : selectedSemesterId),
    [loadCourses, isTeacher, selectedSemesterId]);
  const handleCourseTypeChange = useCallback((value) => {
    setCourseTypeFilter(value);
    setVisibleLimit(PAGE_SIZE);
  }, []);
  const handleSectionFilterChange = useCallback((value) => {
    setSectionFilter(value);
    setVisibleLimit(PAGE_SIZE);
  }, []);

  const currentCourses = resultIdentity === identity ? courses : [];
  const currentSemesterInfo = resultIdentity === identity ? semesterInfo : null;
  const isLoading = loading || (resultIdentity !== identity && !fetchError);
  const electiveCount = !isTeacher ? currentCourses.filter((course) => course.isElective).length : 0;
  const coreCount = !isTeacher ? currentCourses.length - electiveCount : 0;
  const hasElectives = electiveCount > 0;
  const effectiveTypeFilter = hasElectives ? courseTypeFilter : "all";
  const typeFilteredCourses = useMemo(() => filterByCourseType(currentCourses, effectiveTypeFilter),
    [currentCourses, effectiveTypeFilter]);
  // #1: faculty-only section/class filter -- narrows the list to one section (identified the same
  // way sectionsPopover already groups them) before search, so search operates on the already-
  // narrowed set rather than fighting it.
  const sectionFilteredCourses = useMemo(() => {
    if (!isTeacher || sectionFilter === "all") return typeFilteredCourses;
    return typeFilteredCourses.filter((course) => !course.invalidRecord && sectionKey(course) === sectionFilter);
  }, [typeFilteredCourses, isTeacher, sectionFilter]);
  const displayedCourses = useMemo(() => searchCourses(sectionFilteredCourses, searchQuery),
    [sectionFilteredCourses, searchQuery]);
  const visibleCourses = displayedCourses.slice(0, visibleLimit);
  // Learner view: core courses first, electives after, so the grid can label the electives group.
  const orderedVisibleCourses = isTeacher ? visibleCourses
    : [...visibleCourses.filter((course) => !course.isElective), ...visibleCourses.filter((course) => course.isElective)];
  // No point labeling a group that's already the only thing on screen (type filter narrowed to just one).
  const firstElectiveIndex = isTeacher || effectiveTypeFilter !== "all" ? -1
    : orderedVisibleCourses.findIndex((course) => course.isElective);
  const validCourses = currentCourses.filter((course) => !course.invalidRecord);
  const malformedRecords = currentCourses.some((course) => course.invalidRecord || course.metadataIncomplete);
  const invalidCredits = !isTeacher && validCourses.some((course) => course.credits != null &&
    course.credits !== "" && (!Number.isFinite(Number(course.credits)) || Number(course.credits) < 0));
  const semesterOptions = useMemo(() => availableSemesters.map((semester) => ({
    value: semester.id,
    label: semester.name || `Semester ${semester.semester_number}`,
  })), [availableSemesters]);
  const selectedSemesterValue = semesterOptions.some((option) => option.value === selectedSemesterId)
    ? selectedSemesterId : undefined;
  const semesterLabel = currentSemesterInfo?.semesterName || (currentSemesterInfo?.currentSemester != null
    ? `Semester ${currentSemesterInfo.currentSemester}` : null);
  const selectedMeta = availableSemesters.find((semester) => semester.id === selectedSemesterId);
  const filterLabel = selectedMeta?.name || (selectedMeta?.semester_number != null
    ? `Semester ${selectedMeta.semester_number}` : null) || "Semester";
  const totalCredits = !isTeacher ? currentCourses.reduce((sum, course) => sum + safeCredits(course.credits), 0) : 0;
  const sections = useMemo(() => {
    const grouped = new Map();
    if (isTeacher) currentCourses.filter((course) => !course.invalidRecord).forEach((course) => {
      const key = sectionKey(course);
      if (!grouped.has(key)) grouped.set(key, { key, name: course.sectionName || "Unknown section",
        batch: course.batchName || "", count: 0 });
      grouped.get(key).count += 1;
    });
    return [...grouped.values()];
  }, [currentCourses, isTeacher]);
  const sectionFilterOptions = useMemo(() => [
    { value: "all", label: `All sections (${validCourses.length})` },
    ...sections.map((section) => ({
      value: section.key,
      label: `${section.name}${section.batch ? ` (${section.batch})` : ""} · ${section.count}`,
    })),
  ], [sections, validCourses.length]);
  const pageTitle = isTeacher ? "My Courses" : "Courses";
  const pageClasses = `scroll-container learn-courses-page learn-courses-page--placements learn-placements-dashboard ${isTeacher ? "teacher-courses-page" : ""}`;
  const detailsPopover = currentSemesterInfo && (
    <div className="metric-popover-info">
      {currentSemesterInfo.programName && <p><strong>Program:</strong> {currentSemesterInfo.programName}</p>}
      {currentSemesterInfo.batchName && <p><strong>Batch:</strong> {currentSemesterInfo.batchName}</p>}
      {currentSemesterInfo.academicYear && <p><strong>Academic Year:</strong> {currentSemesterInfo.academicYear}</p>}
      {semesterLabel && <p><strong>Semester:</strong> {semesterLabel}</p>}
    </div>
  );
  const filtersPanel = (
    <div className="learn-courses-filters-panel">
      <div className="learn-courses-filters-panel__row">
        <span className="learn-courses-filters-panel__label">Semester</span>
        <Select value={selectedSemesterValue} onChange={handleSemesterChange}
          options={semesterOptions} placeholder="Select semester" loading={semestersLoading || refreshing}
          notFoundContent="No semesters found" size="small" style={{ minWidth: 180 }}
          aria-label="Select semester" />
      </div>
    </div>
  );
  const coursePopover = currentCourses.length > 0 && (
    <ul className="metric-popover-list">
      {currentCourses.slice(0, 100).map((course, index) => {
        const href = cardHref(course);
        const learnerAccess = isTeacher ? null : learnerAvailability(course);
        return <li key={course.mappingId ?? `${course.id}-${course.clsid}-${index}`}>
          {href ? <Link href={href} className="metric-popover-item" onClick={() => activateCourse(course)}>
            <span className="metric-popover-item__name">{course.name}</span>
            {isTeacher && course.sectionName && <span className="metric-popover-item__value">{course.sectionName}</span>}
          </Link> : <span className="metric-popover-item" aria-disabled="true" title={learnerAccess?.reason || "Course unavailable"}>
            {course.name} — {offCurrentSemester ? "Reference only" : learnerAccess?.visible && !learnerAccess?.actionable ? "Locked" : "Unavailable"}
          </span>}
        </li>;
      })}
      {currentCourses.length > 100 && <li className="metric-popover-item">Showing first 100; search the full list below.</li>}
    </ul>
  );
  const creditsPopover = !isTeacher && totalCredits > 0 && (
    <>
      <ul className="metric-popover-list">{currentCourses.filter((course) => safeCredits(course.credits) > 0)
        .slice(0, 100).map((course, index) => <li key={`${course.id}-${index}`} className="metric-popover-item">
          <span className="metric-popover-item__name">{course.name}</span>
          <span className="metric-popover-item__value">{safeCredits(course.credits)} cr</span>
        </li>)}</ul>
      <div className="metric-popover-summary"><span>Total</span><span>{totalCredits} Credits</span></div>
    </>
  );
  const sectionsPopover = isTeacher && (
    <ul className="metric-popover-list">{sections.slice(0, 100).map((section, index) =>
      <li key={`${section.name}-${section.batch}-${index}`} className="metric-popover-item">
        <span className="metric-popover-item__name">{section.name}{section.batch ? ` (${section.batch})` : ""}</span>
        <span className="metric-popover-item__value">{section.count} {section.count === 1 ? "assignment" : "assignments"}</span>
      </li>)}</ul>
  );

  const renderHeader = (withMetrics = false, withSearch = false) => (
    <ListingPageHeader title={pageTitle} ariaLabel="Courses overview"
      subtitle={!isTeacher && currentSemesterInfo?.programName
        ? <span className="learn-courses-program-chip" title={currentSemesterInfo.programName}>{currentSemesterInfo.programName}</span>
        : null}
      metrics={withMetrics && validCourses.length > 0 && <>
        {!isTeacher && semesterLabel && <MetricPill icon={<CalendarOutlined />} label={semesterLabel}
          variant="teal" popoverTitle="Semester Details" popover={detailsPopover} />}
        <MetricPill icon={<BookOutlined />}
          label={isTeacher ? `${validCourses.length} Teaching ${validCourses.length === 1 ? "assignment" : "assignments"}`
            : `${validCourses.length} ${validCourses.length === 1 ? "Course" : "Courses"}`}
          variant="indigo" popoverTitle={isTeacher ? "Teaching Assignments" : "All Courses"} popover={coursePopover} />
        {!isTeacher && totalCredits > 0 && <MetricPill icon={<StarOutlined />} label={`${totalCredits} Credits`}
          variant="emerald" popoverTitle="Credits Breakdown" popover={creditsPopover} />}
        {isTeacher && sections.length > 0 && <MetricPill icon={<TeamOutlined />}
          label={`${sections.length} ${sections.length === 1 ? "Section" : "Sections"}`}
          variant="violet" popoverTitle="Sections" popover={sectionsPopover} />}
      </>}
      rightContent={withSearch && <>
        {isTeacher && sections.length > 1 && <Select value={sectionFilter} onChange={handleSectionFilterChange}
          options={sectionFilterOptions} className="learn-courses-section-filter" size="middle"
          popupMatchSelectWidth={false} aria-label="Filter by section" data-testid="teacher.courses.section.filter" />}
        {hasElectives && <Segmented value={effectiveTypeFilter} onChange={handleCourseTypeChange}
          className="learn-courses-type-toggle" aria-label="Filter by course type"
          data-testid="learner.courses.type.toggle"
          options={[
            { value: "all", label: <span className="learn-courses-type-toggle__option">All<span className="learn-courses-type-toggle__count">{coreCount + electiveCount}</span></span> },
            { value: "core", label: <span className="learn-courses-type-toggle__option">Regular<span className="learn-courses-type-toggle__count">{coreCount}</span></span> },
            { value: "elective", label: <span className="learn-courses-type-toggle__option learn-courses-type-toggle__option--elective">Electives<span className="learn-courses-type-toggle__count">{electiveCount}</span></span> },
          ]} />}
        {!isTeacher && availableSemesters.length > 0 && <Popover content={filtersPanel} title="Filters"
          trigger="click" placement="bottomRight" overlayClassName="learn-courses-filters-popover">
          <Button icon={<FilterOutlined />} className="learn-courses-filters-btn">{filterLabel}</Button>
        </Popover>}
        {!isTeacher && semestersError && <Button onClick={loadSemesters} loading={semestersLoading}
          icon={<ReloadOutlined />} title={semestersError}>Retry semesters</Button>}
        {currentCourses.length > 0 && <Input placeholder="Search courses…"
          prefix={<SearchOutlined aria-hidden="true" />} value={searchQuery}
          onChange={(event) => { setSearchQuery(event.target.value); setVisibleLimit(PAGE_SIZE); }} allowClear
          className="listing-page-search" aria-label="Search courses" />}
      </>}
    />
  );

  if (isLoading) return <div className={pageClasses} aria-busy="true"><PageShell>
    {renderHeader(false, true)}
    <section className="learn-courses-grid-section" aria-label="Course list" role="status" aria-live="polite">
      <span className="sr-only">Loading courses</span>
      <div className="learn-courses-grid">{[1, 2, 3, 4, 5, 6].map((index) =>
        <div key={index} className="learn-courses-grid__item">
          <div className="learn-course-card learn-course-card--skeleton">
            <div className="learn-course-card__img learn-course-card__img--skeleton">
              <div className="learn-course-card__img-placeholder" aria-hidden="true" />
            </div><div className="learn-course-card__body">
              <SkeletonText lines={3} widths={["70%", "100%", "60%"]} />
            </div>
          </div>
        </div>)}</div>
    </section>
  </PageShell></div>;

  if (fetchError) return <div className={pageClasses}><PageShell>
    {renderHeader(false, true)}
    <div className="learn-courses-empty" role="alert">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={fetchError} />
      <Button type="primary" icon={<ReloadOutlined />} onClick={retryCourses}
        style={{ marginTop: 16 }}>Try again</Button>
    </div>
  </PageShell></div>;

  if (currentCourses.length === 0) return <div className={pageClasses}><PageShell>
    {renderHeader(false, true)}
    <div className="learn-courses-empty" role="status">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={isTeacher ? "No teaching assignments found. Please contact your administrator."
          : academicConfigurationMessage(currentSemesterInfo?.configurationStatus)
          || (currentSemesterInfo?.classId == null ? "Your class is not configured. Please contact your administrator."
          : currentSemesterInfo?.batchId == null ? "Your batch is not configured. Please contact your administrator."
          : currentSemesterInfo?.programId == null ? "Your program is not configured. Please contact your administrator."
          : `No courses found for ${semesterLabel || "the selected semester"}.`)} />
      {!isTeacher && currentSemesterInfo?.fallbackApplied && <p role="status">
        The requested semester was unavailable; showing your current semester instead.
      </p>}
    </div>
  </PageShell></div>;

  return <div className={pageClasses} aria-busy={refreshing ? "true" : undefined}
    data-testid={`${isTeacher ? "teacher" : "learner"}.courses.page`}>
    <PageShell>
      {renderHeader(true, true)}
      {refreshing && <p role="status" className="learn-courses-results-info learn-courses-results-info--refreshing">
        Updating courses for the selected semester…
      </p>}
      {refreshError && <p role="alert" className="learn-courses-results-info learn-courses-results-info--error">
        {refreshError}
        {failedSemesterId != null && !refreshing ? (
          <>{" "}<Button size="small" type="link" onClick={() => handleSemesterChange(failedSemesterId)}>Retry</Button></>
        ) : null}
      </p>}
      {currentSemesterInfo?.fallbackApplied && <p role="status" className="learn-courses-results-info">
        The requested semester was unavailable; showing your current semester instead.
      </p>}
      {malformedRecords && <p role="alert" className="learn-courses-results-info">
        Some course records have incomplete or duplicate information. Unavailable cards cannot be opened. Please contact your administrator.
      </p>}
      {invalidCredits && <p role="alert" className="learn-courses-results-info">
        Some course credit values are invalid and have been excluded from the total.
      </p>}
      <section className="learn-courses-grid-section" aria-label="Course list">
        <p className="learn-courses-results-info ln-lto-reg" aria-live="polite" aria-atomic="true">
          {displayedCourses.length !== currentCourses.length
            ? `Showing ${displayedCourses.length} of ${currentCourses.length} records` : ""}
          {displayedCourses.length > visibleLimit ? ` · ${visibleLimit} currently displayed` : ""}
        </p>
        <div className="learn-courses-grid" data-testid={`${isTeacher ? "teacher" : "learner"}.courses.grid`}>
          {displayedCourses.length === 0 && searchQuery.trim() ?
            <div className="learn-courses-empty-search" data-testid={`${isTeacher ? "teacher" : "learner"}.courses.search.empty`}>
              No courses match &ldquo;{searchQuery.trim()}&rdquo;
            </div>
            : displayedCourses.length === 0 && effectiveTypeFilter !== "all" ?
            <div className="learn-courses-empty-search" data-testid="learner.courses.type.empty">
              {effectiveTypeFilter === "elective" ? "No electives to show right now." : "No regular courses to show — everything this semester is an elective."}
            </div>
            : displayedCourses.length === 0 && isTeacher && sectionFilter !== "all" ?
            <div className="learn-courses-empty-search" data-testid="teacher.courses.section.empty">
              No teaching assignments in this section.
            </div>
            : orderedVisibleCourses.map((course, index) => {
              const href = cardHref(course);
              const creditsValid = course.credits == null || course.credits === "" ||
                (Number.isFinite(Number(course.credits)) && Number(course.credits) >= 0);
              const content = <>
                <div className="learn-course-card__img">
                  <CourseImage src={course.image} alt={`${course.name} course thumbnail`} />
                </div>
                <div className="learn-course-card__body">
                  <h3 className="learn-course-card__title">{course.name}</h3>
                  {isTeacher ? <>
                    {course.role && course.role !== "PRIMARY" && <Tag color="orange" className="learn-course-card__role">
                      Your role: {course.role === "CO_TEACHER" ? "Co-teacher" : course.role === "TA" ? "TA" : String(course.role).charAt(0) + String(course.role).slice(1).toLowerCase().replace(/_/g, " ")}
                    </Tag>}
                    {course.metadataIncomplete && <Tag color="orange">Incomplete assignment data</Tag>}
                    {(course.sectionName || course.batchName) && <span className="learn-course-card__section">
                      {course.sectionName || "Unknown section"}{course.batchName ? ` (${course.batchName})` : ""}
                    </span>}
                  </> : <>
                    {course.isElective && <Tag color="purple" className="learn-course-card__role"
                      data-testid="learner.courses.card.elective">{course.electiveSlotName || "Elective"}</Tag>}
                    <p className="learn-course-card__instructor">
                      Instructor: {course.faculty || "Not assigned"}
                    </p>
                  </>}
                  <div className="learn-course-card__footer">
                    {!isTeacher && course.credits != null && course.credits !== "" &&
                      <span className="learn-course-card__credits">
                        {creditsValid ? `${safeCredits(course.credits)} Credits` : "Credits unavailable"}
                      </span>}
                    {isTeacher && <>
                      {course.semesterNumber != null && <span className="learn-course-card__semester-badge">
                        Semester {course.semesterNumber}</span>}
                      {course.academicYear && <span className="learn-course-card__year-badge">{course.academicYear}</span>}
                    </>}
                  </div>
                </div>
              </>;
              return <React.Fragment key={course.mappingId ?? `${course.id}-${course.clsid}-${index}`}>
                {index === firstElectiveIndex && <h2 className="learn-courses-group-title"
                  data-testid="learner.courses.electives.heading">Electives</h2>}
                <div className="learn-courses-grid__item"
                  data-testid={`${isTeacher ? "teacher" : "learner"}.courses.card.wrap`}>
                  {href ? <Link href={href} className="learn-course-card"
                    data-testid={`${isTeacher ? "teacher" : "learner"}.courses.card.open`}
                    onClick={() => activateCourse(course)}>{content}</Link>
                    : (() => {
                      const access = isTeacher ? null : learnerAvailability(course);
                      const unavailableText = offCurrentSemester ? OFF_SEMESTER_TEXT
                        : access?.visible && !access?.actionable ? access.reason || "Course locked" : "Course link unavailable";
                      return <div className="learn-course-card" aria-disabled="true" title={unavailableText}>
                        {content}<span className="learn-course-card__section">{unavailableText}</span>
                      </div>;
                    })()}
                </div>
              </React.Fragment>;
            })}
        </div>
        {displayedCourses.length > visibleLimit && <div className="learn-courses-results-info">
          <Button onClick={() => setVisibleLimit((previous) => previous + PAGE_SIZE)}>
            Show more courses ({displayedCourses.length - visibleLimit} remaining)
          </Button>
        </div>}
      </section>
    </PageShell>
  </div>;
}
