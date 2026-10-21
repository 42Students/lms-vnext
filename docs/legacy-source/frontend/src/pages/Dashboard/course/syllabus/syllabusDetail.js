import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import Resource from "./resource";
import Video from "./video";
import LiveClassContent from "./liveclass";
import YoutubeVideo from "./youtube";
import { listQuizzesV2 } from "@/api/Services/quizServices";
import {
  getLessonContent,
  getLessonContentMetrics,
  getLessonContentProgress,
  getSubmittedAssign,
} from "@/api/Services/courseServices";
import {
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PlayCircleOutlined,
  FormOutlined,
  YoutubeOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  PlusOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { Alert, Button, Empty, notification, Tag } from "antd";
import { sequenceAction, loginUserAction } from "@/redux/store";
import AddNewLessonContentDrawer from "@/components/Global/Offcanvas/Syallabus/AddNewLessonContentDrawer";
import SortableLessonContentList from "@/components/Global/SortableLessonContentList/SortableLessonContentList";
import LessonProgressBar from "@/components/Course/Syllabus/LessonProgressBar";
import ContentCompletionCheck from "@/components/Course/Syllabus/ContentCompletionCheck";
import { getCourseClassAssignments, resolveCourseClassAssignment } from "@/utils/courseClassAssignment";
import { sortLessonContents } from "@/utils/courseUtils/contentOrder";
import { normalizeQuizContent } from "@/utils/courseUtils/quizContent";
import { isLearnerContentComplete } from "@/utils/courseUtils/contentCompletion";
import { AssignmentLessonCard, QuizLessonCard } from "@/components/Course/Syllabus/LessonActivityCards";
import { learnerChildAvailability } from "@/utils/courseUtils/contentAvailability";


const METRIC_ITEMS = [
  { key: "resource", label: "Resources" },
];

const CONTENT_TYPE_ICON_MAP = {
  resource: { icon: FileTextOutlined },
  video: { icon: PlayCircleOutlined },
  assignment: { icon: FormOutlined },
  youtube: { icon: YoutubeOutlined },
  live_class: { icon: VideoCameraOutlined },
  "live class": { icon: VideoCameraOutlined },
  quiz: { icon: FileTextOutlined },
};

function normalizeContentType(value) {
  const normalized = String(value ?? "").toLowerCase().trim().replace(/\s+/g, "_");
  if (normalized === "assessment" || normalized === "assessments" || normalized === "quiz_v2" || normalized === "quiz2" || normalized === "quiz_content") return "quiz";
  return normalized;
}

function getContentData(content) {
  return content?.contentDataDTO ?? content?.content_data_dto ?? content?.contentData ?? {};
}

function getContentTitle(content) {
  return content?.contentTitle ?? content?.content_title ?? getContentData(content)?.title ?? "Untitled content";
}

const CONTENT_TYPE_LABELS = {
  resource: "Resource",
  video: "Video",
  assignment: "Assignment",
  youtube: "YouTube",
  live_class: "Live Class",
  "live class": "Live Class",
  quiz: "Quiz",
};

const SyllabusDetail = ({
  backToSyllabus,
  previousLesson,
  currentLesson = null,
  nextLesson,
  lastIndex,
  isAdmin,
  adminSelectedClassId,
  focusContentId,
  contentMode = "roadmap",
  backLabel = "Back",
}) => {
  const dispatch = useDispatch();
  const currentLessonIndex = useSelector(
    state => state.course.currentLessonIndex
  );
  const [open, setOpen] = useState(false);
  const [lessonContentData, setLessonContentData] = useState([]);
  const [lessonContentLoading, setLessonContentLoading] = useState(false);
  const [lessonContentLoadError, setLessonContentLoadError] = useState(null);
  const loadedLessonKeyRef = useRef(null);
  const loginUser = useSelector(state => state.loginUser);
  const course = useSelector(state => state.course);
  const quizState = useSelector(state => state.quiz);
  const [api, contextHolder] = notification.useNotification();
  const isFacultyRole = loginUser?.userType === "FACULTY";
  const canAccessCourse = isFacultyRole || loginUser?.userType === "LEARNER" || isAdmin;
  const contentUnitLabel = "item";
  const groupUnitLabel = "lesson";
  const addContentLabel = "Add content";
  const emptyContentLabel = "No lesson content yet";
  const [lessonMetrics, setLessonMetrics] = useState();
  const [refresh, setRefresh] = useState(false);
  const [progressByContentId, setProgressByContentId] = useState({});
  const isLearner = loginUser?.userType === "LEARNER";
  // Same gap as syllabus.js's roadmap: an assignment's submission status already exists (the same
  // endpoint ViewAssignmentModal calls to disable re-submission) but was never consulted here, so a
  // fully-submitted assignment counted as "not done" in this page's own progress bar too.
  const [submittedAssignmentIds, setSubmittedAssignmentIds] = useState(() => new Set());
  const [submittedAssignmentsError, setSubmittedAssignmentsError] = useState(false);
  const submittedLearnerIdRef = useRef(null);
  const fetchSubmittedAssignments = useCallback(() => {
    if (!isLearner || !loginUser?.id) return;
    const learnerId = loginUser.id;
    if (submittedLearnerIdRef.current !== learnerId) {
      submittedLearnerIdRef.current = learnerId;
      setSubmittedAssignmentIds(new Set());
    }
    setSubmittedAssignmentsError(false);
    getSubmittedAssign({ learnerId })
      .then(res => {
        if (submittedLearnerIdRef.current !== learnerId) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setSubmittedAssignmentIds(new Set(list.map(item => item?.lessonContentId).filter(id => id != null)));
        setSubmittedAssignmentsError(false);
      })
      .catch(() => {
        if (submittedLearnerIdRef.current === learnerId) setSubmittedAssignmentsError(true);
      });
  }, [isLearner, loginUser?.id]);
  useEffect(() => { fetchSubmittedAssignments(); }, [fetchSubmittedAssignments]);
  const progressFetchLessonIdRef = useRef(null);
  const loadedProgressKeyRef = useRef(null);
  const [progressLoadError, setProgressLoadError] = useState(false);
  const contentRefsMap = useRef({});
  const courseClassAssignments = getCourseClassAssignments(course);
  const resolvedClassId = useMemo(() => resolveCourseClassAssignment({
    loginClassId: loginUser?.classId,
    assignments: courseClassAssignments,
    selectedClass: isAdmin ? adminSelectedClassId : null,
    preferFirstAssignment: isFacultyRole || isAdmin,
  })?.classId ?? null, [adminSelectedClassId, courseClassAssignments, isAdmin, isFacultyRole, loginUser?.classId]);

  const handleOpenAddContent = () => {
    if (currentLesson?.id ?? currentLesson?.lessonId) {
      dispatch(loginUserAction.handleUserData({
        LessonId: currentLesson?.id ?? currentLesson?.lessonId,
        LessonName: currentLesson?.lessonName ?? currentLesson?.lesson_name,
        ...(isAdmin && adminSelectedClassId != null && adminSelectedClassId > 0 && {
          classId: adminSelectedClassId,
        }),
      }));
    }
    setOpen(true);
  };

  const contentSummary = useMemo(() => {
    if (!lessonContentData?.length) return null;
    const counts = {};
    lessonContentData.forEach(item => {
      const type = normalizeContentType(item?.contentType);
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [lessonContentData]);

  const totalMetrics = useMemo(() => {
    if (!lessonMetrics) return null;
    const items = METRIC_ITEMS
      .map(m => ({ ...m, count: lessonMetrics?.[m.key] || 0 }))
      .filter(m => m.count > 0);
    return items.length > 0 ? items : null;
  }, [lessonMetrics]);

  const lessonProgress = useMemo(() => {
    if (!isLearner || !lessonContentData?.length || progressLoadError || submittedAssignmentsError) return null;
    let completed = 0;
    let nextContentId = null;
    for (let i = 0; i < lessonContentData.length; i++) {
      const c = lessonContentData[i];
      const id = c?.id;
      const done = isLearnerContentComplete(c, { normalizeType: normalizeContentType, progressByContentId, submittedAssignmentIds });
      if (done) {
        completed++;
      } else if (nextContentId == null) {
        nextContentId = id;
      }
    }
    return {
      completed,
      total: lessonContentData.length,
      nextContentId: nextContentId > 0 ? nextContentId : null,
    };
  }, [isLearner, lessonContentData, progressByContentId, submittedAssignmentIds, progressLoadError, submittedAssignmentsError]);

  const scrollToContent = useCallback(
    contentId => {
      const el = contentRefsMap.current[contentId];
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    []
  );

  useEffect(() => {
    if (!currentLesson || !canAccessCourse) return;
    let cancelled = false;
    const lessonId = currentLesson?.id ?? currentLesson?.lessonId;
    const classId = resolvedClassId;
    const learnerHasClass = loginUser?.userType === "LEARNER" && classId != null && classId > 0;
    const shouldFetch =
      isFacultyRole ||
      learnerHasClass ||
      (isAdmin && (classId === 0 || classId > 0));
    if (shouldFetch) {
      fetchLessonContent(lessonId, classId, () => cancelled);
      if (isFacultyRole) fetchLessonMetrics();
      if (isLearner && lessonId != null && lessonId > 0) {
        fetchLessonProgress(lessonId);
      }
    }
    return () => { cancelled = true; };
  }, [currentLesson, contentMode, refresh, quizState?.refresh, canAccessCourse, isFacultyRole, isLearner, isAdmin, resolvedClassId, loginUser?.userType]);

  useEffect(() => {
    if (focusContentId == null || focusContentId <= 0 || !lessonContentData?.length) return;
    const hasTarget = lessonContentData.some(c => Number(c?.id) === Number(focusContentId));
    if (!hasTarget) return;
    const el = contentRefsMap.current[focusContentId];
    if (el && typeof el.scrollIntoView === "function") {
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    }
  }, [focusContentId, lessonContentData]);

  const setProgressForContent = (lessonContentId, updated) => {
    if (lessonContentId == null || lessonContentId <= 0 || updated == null || typeof updated !== "object") return;
    setProgressByContentId(prev => ({ ...prev, [lessonContentId]: { ...prev[lessonContentId], ...updated } }));
  };

  if (!currentLesson) {
    return (
      <div className="scroll-container learn-lesson-contents">
        {contextHolder}
        <div className="learn-lesson-contents__loading">
          <p>Loading {groupUnitLabel}…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-container learn-lesson-contents">
      {contextHolder}
      <>
          <div className="row">
            <div className="col-12">
              <div className="learn-lesson-nav">
                <Button type="text" className="learn-lesson-nav-btn learn-lesson-nav-back"
                  icon={<ArrowLeftOutlined />} onClick={backToSyllabus} aria-label={backLabel}>
                  {backLabel}
                </Button>
                <div className="learn-lesson-nav__group">
                  {Number(currentLessonIndex) > 0 && (
                    <Button type="text" className="learn-lesson-nav-btn" icon={<ArrowLeftOutlined />} onClick={previousLesson}>
                      Previous lesson
                    </Button>
                  )}
                  {!lastIndex && (
                    <Button type="text" className="learn-lesson-nav-btn learn-lesson-nav-next" icon={<ArrowRightOutlined />} onClick={nextLesson}>
                      Next lesson
                    </Button>
                  )}
                </div>
              </div>

              <div className="learn-lesson-head">
                <h4 className="learn-lesson-head__title">{currentLesson?.lessonName || "Loading..."}</h4>
                {isLearner && lessonProgress && (
                  <LessonProgressBar completed={lessonProgress.completed} total={lessonProgress.total}
                    nextContentId={lessonProgress.nextContentId}
                    onContinueClick={() => scrollToContent(lessonProgress.nextContentId)} />
                )}
                {(contentSummary && Object.keys(contentSummary).length > 0) || totalMetrics ? (
                  <div className="learn-lesson-head__stats">
                    {contentSummary && Object.keys(contentSummary).length > 0 && (
                      <>
                        <span className="learn-lesson-head__count">
                          {lessonContentData.length} {lessonContentData.length === 1 ? contentUnitLabel : `${contentUnitLabel}s`}
                        </span>
                        <span className="learn-lesson-head__sep">|</span>
                        {Object.entries(contentSummary).map(([type, count]) => {
                          const iconInfo = CONTENT_TYPE_ICON_MAP[type];
                          const IconComp = iconInfo?.icon || FileTextOutlined;
                          const label = CONTENT_TYPE_LABELS[type] || type;
                          return (
                            <Tag key={type} className="learn-lesson-head__tag">
                              <IconComp className="learn-lesson-head__tag-icon" />
                              {count} {label}
                            </Tag>
                          );
                        })}
                      </>
                    )}
                    {/* The metrics call only counts resources, which the type chips already show
                        ("5 Resource | 5 Resources"); keep it only as a fallback. */}
                    {totalMetrics && !(contentSummary && Object.keys(contentSummary).length > 0) && (
                      <>
                        {contentSummary && Object.keys(contentSummary).length > 0 && (
                          <span className="learn-lesson-head__sep">|</span>
                        )}
                        {totalMetrics.map(metric => (
                          <span key={metric.key} className="learn-lesson-head__metric">
                            <strong>{metric.count}</strong> {metric.label}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              {isFacultyRole && (
                <div className="learn-lesson-add-content-bar">
                  <Button type="primary" className="learn-lesson-add-content-btn" icon={<PlusOutlined />} onClick={handleOpenAddContent}>
                    {addContentLabel}
                  </Button>
                </div>
              )}

              {isLearner && (progressLoadError || submittedAssignmentsError) ? (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Lesson completion state could not be fully verified"
                  description="Content stays available, but completion badges and completion-dependent actions are held until this state is refreshed."
                  action={<Button size="small" onClick={() => { fetchSubmittedAssignments(); const lessonId = currentLesson?.id ?? currentLesson?.lessonId; if (lessonId) fetchLessonProgress(lessonId); }}>Retry state</Button>}
                />
              ) : null}
              {lessonContentLoadError && lessonContentData.length > 0 ? (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Lesson content may be out of date"
                  description={lessonContentLoadError}
                  action={<Button size="small" onClick={() => setRefresh((value) => !value)}>Retry</Button>}
                />
              ) : null}
              {lessonContentLoading && lessonContentData.length === 0 ? (
                <div className="learn-lesson-contents__loading"><p>Loading lesson content…</p></div>
              ) : lessonContentLoadError && lessonContentData.length === 0 ? (
                <Alert
                  type="error"
                  showIcon
                  message="Lesson content could not be loaded"
                  description={lessonContentLoadError}
                  action={<Button size="small" onClick={() => setRefresh((value) => !value)}>Retry</Button>}
                />
              ) : !(lessonContentData.length > 0) ? (
                <div className="learn-lesson-contents__empty">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyContentLabel} />
                </div>
              ) : isAdmin && adminSelectedClassId != null && adminSelectedClassId > 0 ? (
                <>
                  <p className="learn-lesson-reorder-hint">Drag the grip handle to reorder content for this class.</p>
                  <SortableLessonContentList
                    items={lessonContentData ? [...(lessonContentData || [])] : []}
                    lessonId={currentLesson?.id ?? currentLesson?.lessonId}
                    classId={adminSelectedClassId}
                    renderContent={getContent}
                    onOrderSaved={() => setRefresh(!refresh)}
                    contentRefsMap={contentRefsMap}
                  />
                </>
              ) : (
                <ul className="ln-lesson-content-list">
                  {(lessonContentData || []).map((content, index) => {
                    const progress = progressByContentId[content?.id];
                    const isComplete = isLearner
                      && isLearnerContentComplete(content, { normalizeType: normalizeContentType, progressByContentId, submittedAssignmentIds });
                    const learnerAccess = isLearner
                      ? learnerChildAvailability(currentLesson, content)
                      : { visible: true, actionable: true, reason: null };
                    return (
                      <li key={content?.id ?? `content-fallback-${index}`}
                        className={`lesson-content-detail ${isComplete ? "lesson-content-detail--completed" : ""}`}
                        ref={el => { if (content?.id != null && el) contentRefsMap.current[content.id] = el; }}>
                        <ContentCompletionCheck isComplete={isComplete} progress={progress} />
                        <div className="lesson-content-detail__item">
                          {learnerAccess.actionable ? getContent(content) : (
                            <div className="learn-lesson-contents__unknown" role="status">
                              <strong><LockOutlined aria-hidden="true" /> Content locked</strong>
                              <p className="mb-0 mt-1">{learnerAccess.reason}</p>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="learn-lesson-nav learn-lesson-nav--bottom" aria-label="Lesson navigation">
                <Button type="text" className="learn-lesson-nav-btn learn-lesson-nav-back" icon={<ArrowLeftOutlined />} onClick={backToSyllabus}>
                  {backLabel}
                </Button>
                <div className="learn-lesson-nav__group">
                  {Number(currentLessonIndex) > 0 && (
                    <Button type="text" className="learn-lesson-nav-btn" icon={<ArrowLeftOutlined />} onClick={previousLesson}>
                      Previous lesson
                    </Button>
                  )}
                  {!lastIndex && (
                    <Button type="primary" className="learn-lesson-nav-btn learn-lesson-nav-next" icon={<ArrowRightOutlined />} onClick={nextLesson}>
                      Next lesson
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <AddNewLessonContentDrawer
              open={open}
              contentMode={contentMode}
              onContentAdded={() => setRefresh(!refresh)}
              onClose={() => {
                setOpen(false);
                if (isAdmin) dispatch(loginUserAction.handleUserData({ classId: undefined }));
              }}
            />
          </div>
      </>
    </div>
  );

  function fetchLessonContent(lesson_id, class_id, isCancelled) {
    const effectiveClassId = isAdmin && adminSelectedClassId != null ? adminSelectedClassId : (isAdmin ? 0 : class_id);
    const requestKey = `${loginUser?.id ?? loginUser?.userType ?? "anonymous"}:${lesson_id}:${effectiveClassId ?? "none"}`;
    const replacingIdentity = loadedLessonKeyRef.current !== requestKey;
    setLessonContentLoading(true);
    setLessonContentLoadError(null);
    if (replacingIdentity) setLessonContentData([]);
    const courseIdForQuizFetch = course?.selectedCourseId ?? course?.selectedCourse?.id ?? null;
    const lessonContentRequest = getLessonContent({ lessonId: lesson_id, classId: effectiveClassId });
    const quizzesRequest = courseIdForQuizFetch && effectiveClassId
      ? listQuizzesV2({ courseId: courseIdForQuizFetch, classId: effectiveClassId })
      : Promise.resolve({ data: [] });
    Promise.all([lessonContentRequest, quizzesRequest])
      .then(([lessonRes, quizRes]) => {
        if (isCancelled && isCancelled()) return;
        const lessonContents = Array.isArray(lessonRes?.data?.data) ? lessonRes.data.data : [];
        const quizContents = Array.isArray(quizRes?.data) ? quizRes.data : [];
        const normalizedQuizzes = quizContents.map(normalizeQuizContent).filter(Boolean)
          .filter(quiz => Number(quiz?.lessonId) === Number(lesson_id));
        const mergedContents = [...lessonContents, ...normalizedQuizzes]
          .filter(content => content?.enabled !== false && content?.active !== false)
          .filter(content => !isLearner || learnerChildAvailability(currentLesson, content).visible);
        const LessonsContent = sortLessonContents(mergedContents);
        setLessonContentData(LessonsContent || []);
        loadedLessonKeyRef.current = requestKey;
        setLessonContentLoadError(null);
        dispatch(sequenceAction.handleSequenceData({ key: "TotalSequence", value: (LessonsContent || []).length }));
      })
      .catch((error) => {
        if (isCancelled && isCancelled()) return;
        if (replacingIdentity) setLessonContentData([]);
        setLessonContentLoadError(error?.response?.data?.message || error?.message || "Please try again.");
        api.info({ message: "Could not load lesson content", description: "Please try again later.",
          icon: <ExclamationCircleOutlined style={{ color: "#dc2626" }} />, placement: "bottomRight", duration: 3 });
      })
      .finally(() => {
        if (!(isCancelled && isCancelled())) setLessonContentLoading(false);
      });
  }

  function fetchLessonMetrics() {
    if (!currentLesson?.id) return;
    getLessonContentMetrics({ lessonId: currentLesson?.id, classId: isAdmin ? 0 : resolvedClassId })
      .then(res => { setLessonMetrics(res?.data?.metricsResponse); })
      .catch(() => {
        api.info({ message: "Could not load lesson metrics", description: "Please try again later.",
          icon: <ExclamationCircleOutlined style={{ color: "#dc2626" }} />, placement: "bottomRight", duration: 3 });
      });
  }

  function fetchLessonProgress(lessonId) {
    if (lessonId == null || (typeof lessonId === "number" && !Number.isFinite(lessonId)) || lessonId <= 0) return;
    const progressKey = `${loginUser?.id ?? "learner"}:${lessonId}`;
    progressFetchLessonIdRef.current = progressKey;
    if (loadedProgressKeyRef.current !== progressKey) setProgressByContentId({});
    setProgressLoadError(false);
    getLessonContentProgress(lessonId)
      .then(res => {
        if (progressFetchLessonIdRef.current !== progressKey) return;
        const list = res?.data?.data ?? res?.data ?? [];
        const map = {};
        (Array.isArray(list) ? list : []).forEach(p => {
          if (p != null && p.lessonContentId != null && p.lessonContentId > 0) map[p.lessonContentId] = p;
        });
        loadedProgressKeyRef.current = progressKey;
        setProgressByContentId(map);
        setProgressLoadError(false);
      })
      .catch(() => {
        if (progressFetchLessonIdRef.current === progressKey) setProgressLoadError(true);
      });
  }

  function getContent(lessonContent) {
    const contentType = normalizeContentType(lessonContent?.contentType);
    switch (contentType) {
      case "resource":
        return <Resource content={lessonContent} refreshAllContent={() => setRefresh(!refresh)}
          progress={progressByContentId[lessonContent?.id]}
          progressUnavailable={progressLoadError}
          onProgressUpdate={(updated) => setProgressForContent(lessonContent?.id, updated)} />;
      case "video":
        return <Video content={lessonContent} refreshAllContent={() => setRefresh(!refresh)}
          progress={progressByContentId[lessonContent?.id]}
          onProgressUpdate={(updated) => setProgressForContent(lessonContent?.id, updated)} />;
      case "youtube":
        return <YoutubeVideo content={lessonContent} refreshAllContent={() => setRefresh(!refresh)}
          progress={progressByContentId[lessonContent?.id]}
          onProgressUpdate={(updated) => setProgressForContent(lessonContent?.id, updated)} />;
      case "assignment":
      case "assessment":
      case "assessments":
        return (
          <AssignmentLessonCard
            content={lessonContent}
            submitted={submittedAssignmentIds.has(lessonContent?.id ?? lessonContent?.lessonContentId)}
            submissionStateUnknown={submittedAssignmentsError}
            onClosed={fetchSubmittedAssignments}
          />
        );
      case "quiz_v2":
      case "quiz":
        return <QuizLessonCard content={lessonContent} onClosed={() => setRefresh(!refresh)} />;
      case "live_class":
      case "live class":
        return <LiveClassContent content={lessonContent} refreshAllContent={() => setRefresh(!refresh)}
          progress={progressByContentId[lessonContent?.id]}
          progressUnavailable={progressLoadError}
          onProgressUpdate={(updated) => setProgressForContent(lessonContent?.id, updated)} />;
      default:
        return (
          <div className="learn-lesson-contents__unknown">
            <strong>This content type isn&apos;t supported yet</strong>
            <p className="mb-0 mt-1">Contact your instructor if this looks wrong.</p>
          </div>
        );
    }
  }
};

export default SyllabusDetail;
