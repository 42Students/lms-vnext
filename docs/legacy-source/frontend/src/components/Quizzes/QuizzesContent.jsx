import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Alert, Button, Modal, Select, Space, message } from "antd";
import { PlusOutlined, FormOutlined, BookOutlined, CheckCircleOutlined } from "@ant-design/icons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import PageShell from "@/components/Common/PageShell";
import MetricPill from "@/components/Global/MetricPill/MetricPill";
import QuizBuilderModal from "@/components/Quiz/QuizBuilderModal";
import { ListSkeleton } from "@/components/Common/Skeletons";
import { getFacultyProgram, getLessonList } from "@/api/Services/courseServices";

import { quizAction } from "@/redux/store";
import dynamic from "next/dynamic";
const Quiztable = dynamic(() => import("@/components/Quiz/Table/table"), { ssr: false });

export default function QuizzesContent() {
  const dispatch = useDispatch();
  const quiz = useSelector((state) => state.quiz);
  const loginUser = useSelector((state) => state.loginUser);
  const isTeacherRole = loginUser?.userType === "FACULTY";

  const [createContextOpen, setCreateContextOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState("");
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState("");
  const [lessonsRetryKey, setLessonsRetryKey] = useState(0);
  const [facultyMappings, setFacultyMappings] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedMappingKey, setSelectedMappingKey] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  // Snapshot of the lesson the builder was actually opened for. `lessons`/`selectedLessonId`
  // are reset by the effect below the instant createContextOpen flips to false - which
  // openBuilder itself does to close the picker - so the builder must not read the live
  // `selectedLesson` (it collapses to null right as the modal opens, and QuizBuilderModal
  // was showing "No lesson selected" even though one had just been picked).
  const [builderLesson, setBuilderLesson] = useState(null);
  const [stats, setStats] = useState({ total: 0, uniqueCourses: 0, submittedCount: 0, courseBreakdown: {}, submittedNames: [] });

  useEffect(() => {
    dispatch(quizAction?.setExternalQuiz(false));
    dispatch(quizAction?.handleRefresh(!quiz?.refresh));
  }, [dispatch]);

  const loadFacultyMappings = useCallback(() => {
    setContextLoading(true);
    setContextError("");
    return getFacultyProgram({ facultyId: loginUser?.id })
      .then((res) => {
        const rows = res?.data?.data ?? [];
        const normalized = rows
          .map((item) => ({
            key: String(item.id ?? `${item.courseId || item.course_id}:${item.classId || item.class_id}`),
            courseId: item.courseId || item.course_id,
            classId: item.classId || item.class_id,
            courseSlug: item.courseSlug || item.course_slug,
            courseName: item.courseName || `Course ${item.courseId || item.course_id}`,
            className: item.className || `Class ${item.classId || item.class_id}`,
          }))
          .filter((item) => item.courseId);
        setFacultyMappings(normalized);
        if (normalized.length === 1) {
          setSelectedMappingKey(normalized[0].key);
        }
      })
      .catch((error) => {
        setFacultyMappings([]);
        setSelectedMappingKey(null);
        setContextError(error?.response?.data?.message || "Unable to load your assigned courses. Please try again.");
      })
      .finally(() => setContextLoading(false));
  }, [loginUser?.id]);

  const handleOpen = useCallback(() => {
    setCreateContextOpen(true);
    setFacultyMappings([]);
    setLessons([]);
    setSelectedMappingKey(null);
    setSelectedLessonId(null);
    setContextError("");
    setLessonsError("");
    loadFacultyMappings();
  }, [loadFacultyMappings]);

  const handleClose = useCallback(() => {
    dispatch(quizAction?.setExternalQuiz(false));
    dispatch(quizAction?.handleRefresh(!quiz?.refresh));
    setBuilderOpen(false);
    setBuilderLesson(null);
  }, [dispatch, quiz?.refresh]);

  const selectedMapping = useMemo(
    () => facultyMappings.find((item) => item.key === selectedMappingKey) || null,
    [facultyMappings, selectedMappingKey]
  );

  const selectedLesson = useMemo(() => {
    const lesson = lessons.find((item) => Number(item.lessonId) === Number(selectedLessonId));
    return lesson ? { lessonId: lesson.lessonId, lessonName: lesson.lessonName } : null;
  }, [lessons, selectedLessonId]);

  useEffect(() => {
    if (!createContextOpen || !selectedMapping) {
      setLessons([]);
      setSelectedLessonId(null);
      return;
    }
    setLessonsLoading(true);
    setLessonsError("");
    setLessons([]);
    setSelectedLessonId(null);
    getLessonList({
      courseId: selectedMapping.courseId,
      courseSlug: selectedMapping.courseSlug,
      classId: selectedMapping.classId,
    })
      .then((res) => {
        const rows = res?.data?.data ?? res?.data ?? [];
        const normalized = rows
          .map((item) => {
            const lesson = item.lesson ?? item;
            return {
              lessonId: lesson.lessonId ?? lesson.id,
              lessonName: lesson.lessonName ?? lesson.lesson_name ?? lesson.name ?? "Untitled lesson",
            };
          })
          .filter((item) => item.lessonId);
        setLessons(normalized);
        if (normalized.length === 1) {
          setSelectedLessonId(normalized[0].lessonId);
        }
      })
      .catch((error) => {
        setLessons([]);
        setSelectedLessonId(null);
        setLessonsError(error?.response?.data?.message || "Unable to load lessons for this course. Please try again.");
      })
      .finally(() => setLessonsLoading(false));
  }, [createContextOpen, selectedMapping, lessonsRetryKey]);

  const openBuilder = useCallback(() => {
    if (!selectedMapping || !selectedLesson) {
      message.warning("Select a course and lesson first.");
      return;
    }
    setBuilderLesson(selectedLesson);
    dispatch(quizAction?.setExternalQuiz(true));
    setCreateContextOpen(false);
    setBuilderOpen(true);
  }, [dispatch, selectedMapping, selectedLesson]);

  const closeCreateContext = useCallback(() => {
    setCreateContextOpen(false);
    setFacultyMappings([]);
    setLessons([]);
    setSelectedMappingKey(null);
    setSelectedLessonId(null);
    setContextError("");
    setLessonsError("");
  }, []);

  const handleDataLoad = useCallback((meta) => {
    if (meta) setStats(meta);
  }, []);

  const coursesPopover = useMemo(() => {
    const breakdown = stats.courseBreakdown || {};
    const entries = Object.entries(breakdown);
    if (entries.length === 0) return null;
    return (
      <ul className="metric-popover-list">
        {entries.map(([name, count]) => (
          <li key={name} className="metric-popover-item">
            <span className="metric-popover-item__name">{name}</span>
            <span className="metric-popover-item__value">{count} {count === 1 ? "quiz" : "quizzes"}</span>
          </li>
        ))}
      </ul>
    );
  }, [stats.courseBreakdown]);

  const submittedPopover = useMemo(() => {
    const names = stats.submittedNames || [];
    if (names.length === 0) return null;
    return (
      <ul className="metric-popover-list">
        {names.map((name, i) => (
          <li key={i} className="metric-popover-item">
            <span className="metric-popover-item__name">{name}</span>
          </li>
        ))}
      </ul>
    );
  }, [stats.submittedNames]);

  const pageClasses = `scroll-container learn-quizzes-page learn-quizzes-page--placements learn-placements-dashboard${isTeacherRole ? " teacher-quizzes-page" : ""}`;

  return (
    <div className={pageClasses}>
      <Modal
        open={createContextOpen}
        title="Create quiz"
        okText="Continue"
        onOk={openBuilder}
        onCancel={closeCreateContext}
        okButtonProps={{ disabled: Boolean(contextError || lessonsError) || !selectedMapping || !selectedLesson, loading: lessonsLoading }}
        destroyOnClose
        className="quiz-create-context-modal ln-mobile-safe-modal"
        wrapClassName="ln-mobile-safe-modal-wrap"
      >
        {contextLoading ? (
          <ListSkeleton rows={3} avatar={false} label="Loading assigned courses" />
        ) : contextError ? (
          <Alert type="error" showIcon message="Assigned courses could not be loaded" description={contextError}
            action={<Button size="small" onClick={loadFacultyMappings}>Retry</Button>} />
        ) : facultyMappings.length === 0 ? (
          <Alert type="warning" showIcon message="No assigned courses found" description="Assign yourself to a course before creating a quiz." />
        ) : (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Select
              value={selectedMappingKey}
              onChange={setSelectedMappingKey}
              placeholder="Select course and class"
              options={facultyMappings.map((item) => ({
                value: item.key,
                label: `${item.courseName} · ${item.className}`,
              }))}
              style={{ width: "100%" }}
            />
            <Select
              value={selectedLessonId}
              onChange={setSelectedLessonId}
              placeholder={lessonsError ? "Lessons unavailable — retry below" : "Select lesson"}
              loading={lessonsLoading}
              disabled={!selectedMapping || lessonsLoading || Boolean(lessonsError)}
              options={lessons.map((item) => ({
                value: item.lessonId,
                label: item.lessonName,
              }))}
              style={{ width: "100%" }}
            />
            {lessonsError ? (
              <Alert type="error" showIcon message="Lessons could not be loaded" description={lessonsError}
                action={<Button size="small" onClick={() => setLessonsRetryKey((key) => key + 1)}>Retry lessons</Button>} />
            ) : selectedMapping && !lessonsLoading && lessons.length === 0 ? (
              <Alert type="info" showIcon message="No lessons in this course yet" description="Create a lesson before attaching a quiz to this course." />
            ) : null}
            <Alert
              type="info"
              showIcon
              message="Quizzes are attached to lessons"
              description="This keeps faculty creation and learner attempts under the same course structure."
            />
          </Space>
        )}
      </Modal>
      <QuizBuilderModal
        open={builderOpen}
        onClose={handleClose}
        onCreated={() => {}}
        lesson={builderLesson}
        courseId={selectedMapping?.courseId}
        classId={selectedMapping?.classId}
      />
      {/* PageShell (see src/components/Common/PageShell.jsx) already provides the outer white
          card — this used to wrap its own ln-module-card around the same content a second time.
          No `title` passed: ListingPageHeader below is this page's one heading. */}
      <PageShell>
        <ListingPageHeader
          title={isTeacherRole ? "My Quizzes" : "All Quizzes"}
          ariaLabel="Quizzes overview"
          metrics={stats.total > 0 && (
            <>
              <MetricPill
                icon={<FormOutlined />}
                label={`${stats.total} ${stats.total === 1 ? "Quiz" : "Quizzes"}`}
                variant="teal"
              />
              {isTeacherRole && stats.uniqueCourses > 0 && (
                <MetricPill
                  icon={<BookOutlined />}
                  label={`${stats.uniqueCourses} ${stats.uniqueCourses === 1 ? "Course" : "Courses"}`}
                  variant="indigo"
                  popoverTitle="Quizzes by Course"
                  popover={coursesPopover}
                />
              )}
              {!isTeacherRole && stats.submittedCount > 0 && (
                <MetricPill
                  icon={<CheckCircleOutlined />}
                  label={`${stats.submittedCount} Submitted`}
                  variant="emerald"
                  popoverTitle="Submitted Quizzes"
                  popover={submittedPopover}
                />
              )}
            </>
          )}
          rightContent={isTeacherRole && (
            <button type="button" className="listing-page-create-btn" onClick={handleOpen}>
              <PlusOutlined /> Create Quiz
            </button>
          )}
        />

        <section className="learn-quizzes-grid-section" aria-label="Quiz list">
          <Quiztable onDataLoad={handleDataLoad} />
        </section>
      </PageShell>
    </div>
  );
}
