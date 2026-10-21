import { isPastDeadline } from "@/utils/dateUtils";
import React from "react";
import { useState, useEffect, useRef } from "react";
import { getLessonList, getLessonContentProgress, getSubmittedAssign } from "../../../../api/Services/courseServices";
import { sortLessonContents } from "@/utils/courseUtils/contentOrder";
import { isLearnerContentComplete } from "@/utils/courseUtils/contentCompletion";
import { listQuizzesV2 } from "@/api/Services/quizServices";
import { useDispatch, useSelector } from "react-redux";
import { quizAction, courseAction, loginUserAction } from "@/redux/store";
import { Alert, Button, Skeleton, notification, Modal, Spin, Empty, Dropdown } from "antd";
import {
  BookOutlined,
  RightOutlined,
  CheckCircleFilled,
  PlayCircleOutlined,
  ClockCircleOutlined,
  YoutubeOutlined,
  FileTextOutlined,
  FormOutlined,
  QuestionCircleOutlined,
  VideoCameraOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import AddNewLessonContentDrawer from "@/components/Global/Offcanvas/Syallabus/AddNewLessonContentDrawer";
import DrawerAssignment from "@/components/Global/Offcanvas/Assignment/newAssignment";
import QuizBuilderModal from "@/components/Quiz/QuizBuilderModal";
import Video from "./video";
import YoutubeVideo from "./youtube";
import Resource from "./resource";
import LiveClassContent, { liveSessionSchedule } from "./liveclass";
import SyllabusDetail from "./syllabusDetail";
import { learnerChildAvailability } from "@/utils/courseUtils/contentAvailability";

const ViewAssignmentModal = dynamic(() => import("@/components/Assignments/ViewAssignmentModal"), { ssr: false });

// Content type counts for lesson breakdown (icons + labels)
const CONTENT_ORDER = [
  { key: "resource", label: "Resource", plural: "Resources", icon: FileTextOutlined },
  { key: "video", label: "video", plural: "videos", icon: PlayCircleOutlined },
  { key: "youtube", label: "YouTube", plural: "YouTube", icon: YoutubeOutlined },
  { key: "assignment", label: "Assignment", plural: "Assignments", icon: FileTextOutlined },
  { key: "quiz", label: "Quiz", plural: "Quizzes", icon: FileTextOutlined },
  { key: "live_class", label: "Live session", plural: "Live sessions", icon: ClockCircleOutlined },
];

// Same 5 types the old bottom-of-lesson pill row offered, now the options behind the top "Add
// content" dropdown. Keeping the same `openAddContent(lessonIndex, type)` type strings so nothing
// downstream (drawer routing) needed to change.
const ADD_CONTENT_OPTIONS = [
  { type: "video", label: "Video", icon: PlayCircleOutlined },
  { type: "resources", label: "Resources", icon: FileTextOutlined },
  { type: "quiz", label: "Quiz", icon: QuestionCircleOutlined },
  { type: "assignment", label: "Assignment", icon: FormOutlined },
  { type: "live", label: "Live Session", icon: VideoCameraOutlined },
];

const CONTENT_MODE_LABELS = {
  roadmap: {
    title: "Learning Path",
    singular: "lesson",
    plural: "lessons",
    groupSingular: "lesson",
    groupPlural: "lessons",
    emptyTitle: "No roadmap items yet",
    emptyDescription: "Create lessons and add content to show the learner roadmap.",
    addLabel: "Open roadmap",
    backLabel: "Back to Learning Path",
  },
  blueprint: {
    title: "Course Blueprint",
    singular: "lesson",
    plural: "lessons",
    groupSingular: "lesson",
    groupPlural: "lessons",
    emptyTitle: "No lessons yet",
    emptyDescription: "Lessons are managed by the admin team. Once lessons are available, faculty can add lectures, resources, assessments, and live classes here.",
    backLabel: "Back to Blueprint",
  },
};

// Not used to gate a page anymore (the old separate Lectures/Resources tabs are gone) — these two
// Sets now only classify content for getTabForContent()'s roadmap filter-chip buckets.
const CONTENT_MODE_TYPES = {
  lectures: new Set(["video", "youtube"]),
  resources: new Set(["resource"]),
};

const ROADMAP_CONTENT_FILTERS = [
  { key: "all", label: "All" },
  { key: "lectures", label: "Lectures" },
  { key: "resources", label: "Resources" },
  { key: "assessments", label: "Assessments" },
  { key: "live-sessions", label: "Live sessions" },
];

function getFilterLabel(key) {
  const match = ROADMAP_CONTENT_FILTERS.find(f => f.key === key);
  return (match ? match.label : "items").toLowerCase();
}

function normalizeContentType(value) {
  const keyMap = {
    live_class: "live_class",
    "live class": "live_class",
  };
  const normalized = (value ?? "").toString().toLowerCase().trim().replace(/\s+/g, "_");
  return keyMap[normalized] ?? normalized;
}

// Both call sites hardcode the "roadmap" literal (never a non-roadmap mode), so this always
// returns true. Kept as a named predicate rather than inlined so a future non-roadmap use is an
// explicit, deliberate change rather than a silent revival of the old lectures/resources gating
// (which would need a "blueprint" entry in CONTENT_MODE_TYPES it's never had — that gap already
// caused two real bugs today in other files).
function isModeContent() {
  return true;
}

function getLessonContents(lessonWrapper) {
  return lessonWrapper?.lessonContents ?? lessonWrapper?.lesson_contents ?? lessonWrapper?.contents ?? [];
}

function findContentById(lessons, contentId) {
  if (!contentId || !Array.isArray(lessons)) return null;
  for (const lessonWrapper of lessons) {
    const contents = getLessonContents(lessonWrapper);
    const match = (Array.isArray(contents) ? contents : []).find(
      content => Number(content?.id ?? content?.lessonContentId ?? content?.lesson_content_id) === Number(contentId)
    );
    if (match) return match;
  }
  return null;
}

function getTabForContent(content) {
  const type = normalizeContentType(content?.contentType ?? content?.content_type);
  if (type === "assignment" || type === "quiz") return "assessments";
  if (type === "live_class") return "live-sessions";
  if (CONTENT_MODE_TYPES.lectures.has(type)) return "lectures";
  if (CONTENT_MODE_TYPES.resources.has(type)) return "resources";
  return null;
}

function getRoadmapFilterBucket(content) {
  return getTabForContent(content) || "all";
}

function matchesRoadmapFilter(content, filterKey) {
  if (!filterKey || filterKey === "all") return true;
  return getRoadmapFilterBucket(content) === filterKey;
}

function getContentBreakdown(lessonContents) {
  if (!Array.isArray(lessonContents) || lessonContents.length === 0) return null;
  const counts = {};
  lessonContents.forEach(item => {
    const t = normalizeContentType(item?.contentType ?? item?.content_type);
    if (t) counts[t] = (counts[t] || 0) + 1;
  });
  return counts;
}

function getContentTitle(item) {
  return item?.contentTitle ?? item?.content_title ?? item?.title ?? "Untitled";
}

function getContentData(item) {
  return item?.contentDataDTO ?? item?.content_data_dto ?? item?.contentData ?? item?.content_data ?? {};
}

function getContentLessonId(item) {
  return item?.lessonId ?? item?.lesson_id ?? item?.lesson?.id ?? item?.lesson?.lessonId ?? item?.lesson?.lesson_id ?? null;
}

function getContentCourseId(item) {
  return item?.courseId ?? item?.course_id ?? item?.course?.id ?? item?.course?.courseId ?? item?.course?.course_id ?? null;
}

function getContentClassId(item) {
  return item?.classId ?? item?.class_id ?? null;
}

function getContentStorageKey(item) {
  const data = getContentData(item);
  return data?.file_dto?.cloud_storage_object
    ?? data?.fileDTO?.cloudStorageObject
    ?? data?.fileDto?.cloudStorageObject
    ?? data?.fileKey
    ?? data?.file_key
    ?? "";
}

function getLectureLabel(type) {
  if (type === "youtube") return "YouTube";
  if (type === "video") return "Video";
  return "Lecture";
}

function getRoadmapContentLabel(type) {
  if (type === "resource") return "Resource";
  if (type === "assignment") return "Assignment";
  if (type === "quiz") return "Quiz";
  if (type === "live_class") return "Live session";
  if (type === "youtube" || type === "video") return "Lecture";
  return "Content";
}

function getRoadmapContentTone(type) {
  if (type === "assignment" || type === "quiz") return "assessment";
  if (type === "live_class") return "live";
  if (type === "youtube" || type === "video") return "lecture";
  if (type === "resource") return "resource";
  return "default";
}

function getRoadmapDestinationLabel(tab) {
  if (tab === "lectures") return "View lecture";
  if (tab === "resources") return "View resource";
  if (tab === "assessments") return "View assessment";
  if (tab === "live-sessions") return "View live session";
  return "View item";
}

// #9's fix blocks opening an already-expired quiz, but only once you click in -- a learner
// scanning the list still had to click a dead item to find out it was too late, the same
// "click to discover it's dead" pattern #11 fixed for live sessions. Surfacing it directly on the
// list row means they never have to click in the first place. Assignments also close at their
// deadline; they remain reviewable but no longer expose a submit action.
/** Due date for a quiz/assignment row: a short label plus whether it has passed. */
export function roadmapDueInfo(content) {
  const raw = content?.deadline
    ?? content?.dueAt ?? content?.due_at
    ?? content?.contentDataDTO?.due_date ?? content?.contentDataDTO?.dueDate
    ?? content?.content_data_dto?.due_date ?? content?.content_data_dto?.dueDate ?? null;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const hasTime = /T\d{2}:\d{2}/.test(String(raw)) || /\d{2}:\d{2}/.test(String(raw).slice(10));
  const label = date.toLocaleString(undefined, {
    day: "2-digit", month: "short",
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
    ...(hasTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
  return { label, past: isPastDeadline(raw) };
}

export function isExpiredUnsubmittedQuiz(type, content) {
  if (type !== "quiz" || content?.submitted) return false;
  const dueDate = content?.deadline ?? content?.dueAt ?? content?.due_at
    ?? content?.contentDataDTO?.due_date ?? content?.contentDataDTO?.dueDate ?? null;
  if (!dueDate) return false;
  // LRN-X-03: India time, as the server enforces it.
  return isPastDeadline(dueDate);
}

function getContentSortKey(content, index = 0) {
  const candidates = [
    content?.sequence,
    content?.displayOrder,
    content?.display_order,
    content?.sortOrder,
    content?.sort_order,
    content?.order,
    content?.position,
    content?.createdAt,
    content?.created_at,
    content?.updatedAt,
    content?.updated_at,
    content?.id,
    content?.lessonContentId,
    content?.lesson_content_id,
  ];
  for (const candidate of candidates) {
    if (candidate == null || candidate === "") continue;
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
    const numeric = Number(candidate);
    if (!Number.isNaN(numeric)) return numeric;
    const timestamp = Date.parse(candidate);
    if (!Number.isNaN(timestamp)) return timestamp;
  }
  return index;
}

function normalizeQuizForRoadmap(quizItem) {
  if (!quizItem) return null;
  const lessonId = getContentLessonId(quizItem);
  const courseId = getContentCourseId(quizItem);
  const classId = getContentClassId(quizItem);
  const contentId = quizItem?.id ?? quizItem?.quizId ?? quizItem?.quiz_id ?? null;
  if (contentId == null) return null;

  return {
    ...quizItem,
    id: contentId,
    lessonId,
    courseId,
    classId,
    quizId: quizItem?.quizId ?? quizItem?.quiz_id ?? contentId,
    quiz_id: quizItem?.quiz_id ?? quizItem?.quizId ?? contentId,
    contentType: "quiz",
    content_title: quizItem?.title ?? quizItem?.contentTitle ?? quizItem?.content_title ?? "Untitled quiz",
    contentTitle: quizItem?.title ?? quizItem?.contentTitle ?? quizItem?.content_title ?? "Untitled quiz",
    contentDataDTO: {
      ...(quizItem?.contentDataDTO || quizItem?.content_data_dto || {}),
      due_date: quizItem?.dueAt ?? quizItem?.due_at ?? quizItem?.contentDataDTO?.due_date ?? quizItem?.content_data_dto?.due_date ?? null,
      dueDate: quizItem?.dueAt ?? quizItem?.due_at ?? quizItem?.contentDataDTO?.dueDate ?? quizItem?.content_data_dto?.dueDate ?? null,
    },
    points: quizItem?.totalPoints ?? quizItem?.total_points ?? quizItem?.points ?? 0,
  };
}

function RoadmapContentViewer({ item, progress, onProgressUpdate, onContentChanged }) {
  const content = item?.content;
  const type = item?.type ?? normalizeContentType(content?.contentType ?? content?.content_type);
  const contentId = content?.id ?? content?.lessonContentId ?? content?.lesson_content_id;
  const modalTitle = getContentTitle(content);

  if (!content) {
    return <Empty description="No content selected" />;
  }

  // video/youtube previously shared this one branch and both rendered <Video>, which only ever
  // resolves a playback URL for contentType "video" (see resolvePlaybackUrl in video.js) — opening
  // a YouTube item from the roadmap modal always rendered "Video not available". Neither branch
  // was passed progress/onProgressUpdate either, so watching a video from this modal (as opposed
  // to the full lesson page) never saved watch progress at all.
  if (type === "video") {
    return <Video inModal content={content} refreshAllContent={onContentChanged} progress={progress} onProgressUpdate={onProgressUpdate} />;
  }

  if (type === "youtube") {
    return <YoutubeVideo inModal content={content} refreshAllContent={onContentChanged} progress={progress} onProgressUpdate={onProgressUpdate} />;
  }

  if (type === "resource") {
    return <Resource content={content} refreshAllContent={onContentChanged} progress={progress} onProgressUpdate={onProgressUpdate} inModal />;
  }

  // "assignment" is handled by ViewAssignmentModal, rendered as its own Drawer alongside this
  // Modal in the parent — see the comment there for why it isn't dispatched through here.

  if (type === "live_class") {
    return (
      <LiveClassContent inModal refreshAllContent={onContentChanged} content={content} contentType={getRoadmapContentLabel(type)} deleteType="LIVE_CLASS"
        progress={progress} onProgressUpdate={onProgressUpdate} />
    );
  }

  if (type === "quiz") {
    // Every quiz reaching this component comes from roadmapQuizItems (listQuizzesV2 ->
    // normalizeQuizForRoadmap), which always sets quizId/quiz_id -- there is no other quiz
    // system left to fall back to.
    const quizUrl = content?.quizId || content?.quiz_id
      ? `/quiz?quizId=${encodeURIComponent(content?.quizId ?? content?.quiz_id)}&embed=roadmap${item?.reviewOnly ? "&review=true" : ""}`
      : "";
    return (
      <div className="ln-roadmap-embedded-view">
        {quizUrl ? (
          <iframe
            src={quizUrl}
            title={modalTitle}
            className="ln-roadmap-embedded-view__frame"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{ width: "100%", height: "min(calc(100dvh - 180px), 720px)", minHeight: "min(680px, calc(100dvh - 180px))", border: 0, borderRadius: 12, display: "block" }}
          />
        ) : (
          <Empty description="Quiz preview is unavailable" />
        )}
      </div>
    );
  }

  return <Empty description={`No viewer available for ${getRoadmapContentLabel(type)}`} />;
}

const Syllabus = ({ contentMode = "roadmap" }) => {
  const router = useRouter();
  const mode = CONTENT_MODE_LABELS[contentMode] ? contentMode : "roadmap";
  const modeLabels = CONTENT_MODE_LABELS[mode];
  const { lesson: lessonIdParam, content: contentIdParam } = router.query || {};
  const [openLessonView, setOpenLessonView] = useState(false);
  const [addContentType, setAddContentType] = useState(null);
  const [addContentLesson, setAddContentLesson] = useState(null);
  const [expandedRoadmapLessons, setExpandedRoadmapLessons] = useState(new Set());
  const [lessonsList, setLessonList] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [lessonsLoadError, setLessonsLoadError] = useState(null);
  const [focusedContentId, setFocusedContentId] = useState(null);
  const [selectedRoadmapContent, setSelectedRoadmapContent] = useState(null);
  const [roadmapQuizItems, setRoadmapQuizItems] = useState([]);
  const [roadmapQuizError, setRoadmapQuizError] = useState(false);
  const [submittedAssignmentsError, setSubmittedAssignmentsError] = useState(false);
  const [progressLoadError, setProgressLoadError] = useState(false);
  // Bumped after closing any roadmap content so the quiz list (and each quiz's `submitted` flag)
  // re-fetches — see the isContentComplete/closeRoadmapContent notes below for why this matters.
  const [roadmapQuizRefreshKey, setRoadmapQuizRefreshKey] = useState(0);
  // Seed from ?filter= so the Overview cards can deep-link into a specific slice of the path
  // (they previously all landed on an unfiltered roadmap, making four labelled cards behave
  // identically). Falls back to "all" for an absent or unrecognised value.
  const filterFromQuery = Array.isArray(router.query.filter) ? router.query.filter[0] : router.query.filter;
  const initialRoadmapFilter = ROADMAP_CONTENT_FILTERS.some(f => f.key === filterFromQuery)
    ? filterFromQuery
    : "all";
  const [roadmapContentFilter, setRoadmapContentFilter] = useState(initialRoadmapFilter);

  // Keep the chips in sync if the user navigates between Overview cards without a remount.
  useEffect(() => {
    if (filterFromQuery && ROADMAP_CONTENT_FILTERS.some(f => f.key === filterFromQuery)) {
      setRoadmapContentFilter(filterFromQuery);
    }
  }, [filterFromQuery]);

  const loginUser = useSelector(state => state.loginUser);
  const isTeacherRole = loginUser?.userType === "FACULTY";

  // Learner progress for the whole path. The roadmap previously fetched none, so a tab literally
  // named "Learning Path" had no notion of what was done, in progress, or next — and the
  // .learn-roadmap__status / __count styles built for exactly this were dead CSS.
  const [progressByContentId, setProgressByContentId] = useState({});

  // Assignments already carry a per-learner submission signal (ViewAssignmentModal fetches the
  // exact same endpoint to disable re-submission), but isContentComplete never consulted it, so a
  // fully-submitted assignment sat in the roadmap as "not done" forever. Fetched once for the
  // whole learner (the endpoint isn't scoped to a course) and reused via a Set of content IDs.
  const [submittedAssignmentIds, setSubmittedAssignmentIds] = useState(() => new Set());
  const fetchSubmittedAssignments = React.useCallback(() => {
    if (isTeacherRole || !loginUser?.id) {
      setSubmittedAssignmentsError(false);
      return;
    }
    getSubmittedAssign({ learnerId: loginUser.id })
      .then(res => {
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setSubmittedAssignmentIds(new Set(list.map(item => item?.lessonContentId).filter(id => id != null)));
        setSubmittedAssignmentsError(false);
      })
      .catch(() => {
        // Keep the last-known completion set. Empty is a valid "nothing submitted" state only
        // after a successful response, so expose this as partial roadmap state instead.
        setSubmittedAssignmentsError(true);
      });
  }, [isTeacherRole, loginUser?.id]);

  useEffect(() => {
    fetchSubmittedAssignments();
  }, [fetchSubmittedAssignments]);

  // Exposed as a callback (not just baked into the effect below) so completing a quiz or video
  // can force a re-fetch on close — otherwise the roadmap's doneCount/"Continue here" only ever
  // reflected progress as of the last lessonsList fetch, so submitting a quiz and closing it left
  // the count and current-lesson pointer stuck exactly where they were before the submission.
  const fetchRoadmapProgress = React.useCallback(() => {
    if (isTeacherRole) return;
    const lessonIds = (Array.isArray(lessonsList) ? lessonsList : [])
      .map(item => item?.lesson?.id ?? item?.lesson?.lessonId ?? item?.lesson?.lesson_id)
      .filter(id => id != null && Number(id) > 0);
    if (lessonIds.length === 0) {
      setProgressByContentId({});
      setProgressLoadError(false);
      return;
    }
    Promise.allSettled(lessonIds.map(id => getLessonContentProgress(id)))
      .then(results => {
        const map = {};
        let failed = false;
        results.forEach(result => {
          if (result.status !== "fulfilled") {
            failed = true;
            return;
          }
          const list = result.value?.data?.data ?? result.value?.data ?? [];
          (Array.isArray(list) ? list : []).forEach(entry => {
            if (entry != null && entry.lessonContentId != null && entry.lessonContentId > 0) {
              map[entry.lessonContentId] = entry;
            }
          });
        });
        // A lesson whose progress failed keeps what we already knew instead of reading as "not started".
        setProgressByContentId(prev => (failed ? { ...prev, ...map } : map));
        setProgressLoadError(failed);
      });
  }, [lessonsList, isTeacherRole]);

  useEffect(() => {
    fetchRoadmapProgress();
  }, [fetchRoadmapProgress]);

  // Mirrors syllabusDetail.js's setProgressForContent — lets the roadmap's own content modal
  // (RoadmapContentViewer) apply an optimistic update the moment a save resolves, the same way the
  // full lesson page already does, instead of waiting on the next fetchRoadmapProgress roundtrip.
  const setProgressForContent = React.useCallback((lessonContentId, updated) => {
    if (lessonContentId == null || lessonContentId <= 0 || updated == null || typeof updated !== "object") return;
    setProgressByContentId(prev => ({ ...prev, [lessonContentId]: { ...prev[lessonContentId], ...updated } }));
  }, []);

  // Quizzes are never written into learnerContentProgress (that table only ever gets a row from
  // the video player's watch-progress reporting) — GET /api/v1/quizzes already returns a
  // per-learner `submitted` flag on each quiz (see QuizResponseDTO/listQuizzes), so use that
  // directly instead. Without this, a submitted quiz's roadmap tile could never flip to "done":
  // there was no progress-table row to find no matter how often it was re-fetched. Assignments
  // have the identical shape of gap (see submittedAssignmentIds above). Shared with
  // syllabusDetail.js via isLearnerContentComplete so the two pages can't drift again.
  const isContentComplete = React.useCallback(
    (content) => isLearnerContentComplete(content, { normalizeType: normalizeContentType, progressByContentId, submittedAssignmentIds }),
    [progressByContentId, submittedAssignmentIds]
  );
  const course = useSelector(state => state.course);
  const currentLessonIndex = useSelector(state => state.course.currentLessonIndex);
  const selectedCourseId = useSelector(state => state.course.selectedCourseId);
  const selectedCourseSlug = useSelector(state => state.course.selectedCourseSlug);
  const dispatch = useDispatch();
  const quiz = useSelector(state => state.quiz);
  const [refresh, setRefresh] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  const setLesson = (lessonIndex, contentId = null) => {
    dispatch(courseAction.setCurrentLessonIndex(lessonIndex));
    dispatch(quizAction?.setIndex(0));
    dispatch(quizAction?.setEdit(false));
    dispatch(quizAction?.handleQuizUpadte([]));
    dispatch(quizAction?.handleRefresh(!quiz?.refresh));
    setFocusedContentId(contentId != null ? Number(contentId) : null);
    setOpenLessonView(true);
  };

  const openRoadmapContent = (lessonIndex, contentId = null) => {
    const lessonWrapper = lessonsList?.[lessonIndex];
    const lesson = lessonWrapper?.lesson ?? lessonWrapper;
    const lessonId = lesson?.id ?? lesson?.lessonId ?? lesson?.lesson_id;
    if (lessonId == null) return;
    const linkedContent = contentId != null ? findContentById(
      lessonsList.map(lessonItem => ({
        ...lessonItem,
        lessonContents: [
          ...getLessonContents(lessonItem),
          ...roadmapQuizItems.filter(quiz => Number(getContentLessonId(quiz)) === Number(lessonItem?.lesson?.id ?? lessonItem?.lessonId ?? lessonItem?.lesson?.lesson_id)),
        ],
      })),
      contentId
    ) : null;
    if (!linkedContent) return;
    if (!isTeacherRole) {
      const access = learnerChildAvailability(lesson, linkedContent);
      if (!access.visible) {
        api.warning({
          message: "Content unavailable",
          description: "This item is not currently published for learners.",
          placement: "bottomRight",
          duration: 5,
        });
        return;
      }
      if (!access.actionable) {
        api.info({
          message: "Content locked",
          description: access.reason,
          placement: "bottomRight",
          duration: 5,
        });
        return;
      }
    }
    const linkedType = normalizeContentType(linkedContent?.contentType ?? linkedContent?.content_type);
    // A past-deadline quiz is never attemptable (the quiz page and backend refuse too). Instead of
    // a dead end, a learner who missed it gets the read-only review with the answer key, and a
    // learner who submitted gets their own attempt.
    const reviewOnly = !isTeacherRole && linkedType === "quiz"
      && (Boolean(linkedContent?.submitted) || isExpiredUnsubmittedQuiz(linkedType, linkedContent));
    setSelectedRoadmapContent({
      reviewOnly,
      content: linkedContent,
      lesson: lessonWrapper,
      lessonIndex,
      type: normalizeContentType(linkedContent?.contentType ?? linkedContent?.content_type),
    });
  };

  const closeRoadmapContent = () => {
    setSelectedRoadmapContent(null);
    // fetchRoadmapProgress refreshes VIDEO/YOUTUBE watch progress only (learnerContentProgressService
    // never records quiz submissions). A submitted quiz's "done" signal lives on the quiz list
    // items themselves (`submitted`, from GET /api/v1/quizzes — see isContentComplete below), so
    // that list needs its own re-fetch too, or a just-submitted quiz keeps reading as not done.
    fetchRoadmapProgress();
    setRoadmapQuizRefreshKey(k => k + 1);
    fetchSubmittedAssignments();
  };

  // The message listener below is registered once ([] deps) and never re-attached, so it would
  // otherwise close over the *first* render's closeRoadmapContent/fetchRoadmapProgress forever —
  // which themselves closed over that first render's (likely still-empty, pre-fetch) lessonsList.
  // Every quiz-close would then call the fetch with zero lesson ids and overwrite real progress
  // with {}, actively erasing the roadmap's done-count instead of refreshing it. Keep a ref to the
  // latest closeRoadmapContent so the listener always calls the current one.
  const closeRoadmapContentRef = useRef(closeRoadmapContent);
  closeRoadmapContentRef.current = closeRoadmapContent;

  // The quiz-taking page renders embedded here as an <iframe> (RoadmapContentViewer's "quiz"
  // branch) with no way to reach back into this parent page directly — it asks to be closed via
  // postMessage instead of trying to navigate its own iframe location (which would just load
  // the destination page nested inside the small embedded view). See quizpanel.js's close button.
  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event?.data?.type === "closeRoadmapQuiz") {
        closeRoadmapContentRef.current();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const toggleRoadmapLesson = (lessonIndex) => {
    const lessonWrapper = lessonsList?.[lessonIndex];
    const lesson = lessonWrapper?.lesson ?? lessonWrapper;
    const lessonId = lesson?.id ?? lesson?.lessonId ?? lesson?.lesson_id;
    if (lessonId == null) return;
    setExpandedRoadmapLessons(prev => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  const openAddContent = (lessonIndex, type) => {
    const lessonWrapper = lessonsList?.[lessonIndex];
    const lesson = lessonWrapper?.lesson ?? lessonWrapper;
    const lessonId = lesson?.id ?? lesson?.lessonId ?? lesson?.lesson_id;
    const lessonName = lesson?.lessonName ?? lesson?.lesson_name ?? "";
    if (lessonId == null) return;
    dispatch(loginUserAction.handleUserData({ LessonId: lessonId, LessonName: lessonName }));
    setAddContentLesson({ lessonId, lessonName });
    setAddContentType(type);
  };

  const closeAddContent = () => {
    setAddContentType(null);
    setAddContentLesson(null);
  };

  const onAddContentSaved = () => {
    closeAddContent();
    setRefresh(!refresh);
  };

  useEffect(() => {
    const roadmapGroupsForEffect = Array.isArray(lessonsList)
      ? lessonsList
          .map((lesson, lessonIndex) => {
            const lessonRecord = lesson?.lesson ?? lesson;
            const contents = getLessonContents(lesson).filter(item =>
              isModeContent(item, "roadmap")
              && (isTeacherRole || learnerChildAvailability(lessonRecord, item).visible)
            );
            return { lesson, lessonIndex, contents };
          })
          .filter(group => isTeacherRole || group.contents.length > 0)
      : [];
    if (roadmapGroupsForEffect.length === 0) return;
    // `group.lesson` here is actually the raw list-item wrapper (see the `lessonsList.map`
    // above), the same shape rendering unwraps via `lesson?.lesson?.id` (line ~927) and
    // `toggleRoadmapLesson` unwraps via `lessonWrapper.lesson` — reading `.id` straight off the
    // wrapper hit its own id instead of the nested lesson's, so the first lesson never matched
    // anything in `expandedRoadmapLessons` and never auto-expanded. Mirror the render-time
    // extraction exactly so the id here matches what gets looked up in the set.
    const firstLessonWrapper = roadmapGroupsForEffect[0]?.lesson;
    const firstLesson = firstLessonWrapper?.lesson?.id ?? firstLessonWrapper?.lessonId ?? firstLessonWrapper?.lesson?.lesson_id;
    if (firstLesson == null) return;
    setExpandedRoadmapLessons(prev => {
      if (prev && prev.size > 0) return prev;
      return new Set([firstLesson]);
    });
  }, [lessonsList, isTeacherRole]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const classId = loginUser?.classId;
    const routeCourseId = Array.isArray(router.query?.courseId) ? router.query.courseId[0] : router.query?.courseId;
    const courseIdentifier = selectedCourseSlug || selectedCourseId || routeCourseId;
    if (!classId || !courseIdentifier) {
      setRoadmapQuizItems([]);
      setRoadmapQuizError(false);
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    const params = selectedCourseSlug
      ? { courseSlug: selectedCourseSlug, classId }
      : { courseId: selectedCourseId ?? routeCourseId, classId };

    listQuizzesV2(params, { signal: controller.signal })
      .then(res => {
        if (cancelled) return;
        const quizzes = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? res?.data ?? []);
        setRoadmapQuizItems(quizzes.map(normalizeQuizForRoadmap).filter(Boolean));
        setRoadmapQuizError(false);
      })
      .catch(err => {
        if (cancelled || err?.name === "AbortError" || err?.name === "CanceledError") return;
        // Preserve any last-known quiz rows instead of turning "quiz source failed" into
        // "this course has no quizzes".
        setRoadmapQuizError(true);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedCourseId, selectedCourseSlug, loginUser?.classId, router.query?.courseId, roadmapQuizRefreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const classId = loginUser?.classId;
    const params = selectedCourseSlug
      ? { courseSlug: selectedCourseSlug, classId }
      : { courseId: selectedCourseId, classId };
    if (!(selectedCourseSlug || selectedCourseId)) {
      setLessonsLoadError(null);
      setLessonsLoading(false);
      return;
    }
    if (!classId) {
      setLessonList([]);
      setLessonsLoadError(null);
      setLessonsLoading(false);
      return;
    }
    setLessonsLoading(true);
    setLessonsLoadError(null);
    getLessonList(params, { signal: controller.signal })
      .then(res => {
        if (cancelled) return;
        setLessonList(res?.data?.data ?? []);
        setLessonsLoadError(null);
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return;
        setLessonList([]);
        setLessonsLoadError(err?.response?.data?.message || "Could not load lessons for this course.");
      })
      .finally(() => {
        if (!cancelled) setLessonsLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [refresh, selectedCourseId, selectedCourseSlug, loginUser?.classId]);

  // Clamp currentLessonIndex when lessonsList shrinks (e.g. after refresh) so we don't stay out of bounds
  useEffect(() => {
    if (!openLessonView || !Array.isArray(lessonsList) || lessonsList.length === 0) return;
    const idx = currentLessonIndex;
    if (idx != null && idx >= lessonsList.length) {
      dispatch(courseAction.setCurrentLessonIndex(lessonsList.length - 1));
    }
  }, [openLessonView, lessonsList, currentLessonIndex, dispatch]);

  // Deep-link: ?lesson=id&content=id opens that lesson and focuses that content (runs once per URL)
  const deepLinkKeyRef = useRef(null);
  useEffect(() => {
    const lessonId = lessonIdParam != null ? parseInt(lessonIdParam, 10) : null;
    const contentId = contentIdParam != null ? parseInt(contentIdParam, 10) : null;
    if (lessonId == null || !Number.isFinite(lessonId) || !Array.isArray(lessonsList) || lessonsList.length === 0) return;
    const key = `${lessonId}-${contentId ?? ""}`;
    if (deepLinkKeyRef.current === key) return;
    const idx = lessonsList.findIndex(l => Number(l?.lesson?.id ?? l?.lessonId) === lessonId);
      if (idx >= 0) {
        deepLinkKeyRef.current = key;
        if (contentId != null && Number.isFinite(contentId)) {
          const linkedContent = findContentById(lessonsList, contentId);
          if (linkedContent) {
            const lessonWrapper = lessonsList[idx];
            const lessonRecord = lessonWrapper?.lesson ?? lessonWrapper;
            if (!isTeacherRole) {
              const access = learnerChildAvailability(lessonRecord, linkedContent);
              if (!access.visible || !access.actionable) {
                deepLinkKeyRef.current = key;
                api.warning({
                  message: access.visible ? "Content locked" : "Content unavailable",
                  description: access.reason,
                  placement: "bottomRight",
                  duration: 5,
                });
                return;
              }
            }
            setFocusedContentId(contentId);
            dispatch(courseAction.setCurrentLessonIndex(idx));
            setOpenLessonView(true);
            setSelectedRoadmapContent({
              content: linkedContent,
              lesson: lessonWrapper,
              lessonIndex: idx,
              type: normalizeContentType(linkedContent?.contentType ?? linkedContent?.content_type),
            });
            return;
          }
        }
      dispatch(courseAction.setCurrentLessonIndex(idx));
      setOpenLessonView(true);
    } else {
      deepLinkKeyRef.current = key;
      api.warning({
        message: "Lesson not found",
        description: "The linked lesson could not be found. It may have been removed or renamed.",
        placement: "bottomRight",
        duration: 5,
      });
    }
    // No cleanup resetting deepLinkKeyRef here: this effect re-runs whenever lessonsList gets a
    // new reference (e.g. after any setRefresh() elsewhere on the page), but the ?lesson=&content=
    // query params are never cleared from the URL after being consumed. Resetting the "already
    // handled" guard on every such re-run — rather than only when lessonId/contentId actually
    // change — used to force the same deep-linked content to silently reopen after every
    // unrelated refresh, even if the user had already closed it.
  }, [lessonIdParam, contentIdParam, lessonsList, dispatch, isTeacherRole, api]);

  const roadmapGroups = Array.isArray(lessonsList)
    ? lessonsList
        .map((lesson, lessonIndex) => {
          const lessonId = lesson?.lesson?.id ?? lesson?.lessonId ?? lesson?.lesson?.lesson_id;
          const roadmapQuizzesForLesson = roadmapQuizItems.filter(item => Number(getContentLessonId(item)) === Number(lessonId));
          // Ordering previously used a local comparator that returned a sequence integer (e.g. 3)
          // for one item and an epoch timestamp (~1.7e12) for a sibling and compared them
          // directly, so every sequenced item sorted ahead of every date-only one regardless of
          // intent. Quizzes are merged in from a separate endpoint with different fields, so
          // mixed metadata is guaranteed here. sortLessonContents ranks by tier first and is what
          // syllabusDetail.js already uses — previously item "04" in the roadmap was not item 4
          // inside the lesson.
          const lessonRecord = lesson?.lesson ?? lesson;
          const contents = sortLessonContents(
            [...getLessonContents(lesson), ...roadmapQuizzesForLesson]
              .filter(item =>
                isModeContent(item, "roadmap")
                && (isTeacherRole || learnerChildAvailability(lessonRecord, item).visible)
              )
          );
          const breakdown = getContentBreakdown(contents);
          const breakdownItems = breakdown
            ? CONTENT_ORDER.filter(c => breakdown[c.key] > 0).map(c => ({
                ...c,
                count: breakdown[c.key],
                labelText: breakdown[c.key] === 1 ? c.label : c.plural,
              }))
            : [];
          return { lesson, lessonIndex, contents, breakdownItems };
        })
        .filter(group => isTeacherRole || group.contents.length > 0)
    : [];

  // The learner's actual "you are here": the first lesson that still has unfinished content.
  // Falls back to the first lesson only when nothing has been started yet.
  const currentRoadmapLessonId = (() => {
    if (isTeacherRole) return null;
    const firstIncomplete = roadmapGroups.find(
      group => group.contents.length > 0 && group.contents.some(content => !isContentComplete(content))
    );
    const target = firstIncomplete ?? null;
    if (!target) return null;
    return target.lesson?.lesson?.id ?? target.lesson?.lessonId ?? target.lesson?.lesson?.lesson_id ?? null;
  })();

  return (
    <div>
      {contextHolder}
      {!openLessonView ? (
        // Same page-head + single content-card structure as ProjectDetailContent's tabs: the
        // pill above already names this tab, so the repeated visible title is sr-only here too.
        <div className="learn-projects-detail learn-syllabus-list">
          <div className="learn-projects-detail__page-head">
            <div>
              <h3 className="learn-projects-detail__page-head-title--sr-only">{modeLabels.title}</h3>
              {mode === "roadmap" && (
                <p className="learn-projects-detail__page-head-subtitle">Keep moving forward, one lesson at a time.</p>
              )}
            </div>
          </div>
          <div className="learn-projects-detail__body">
          <section className="learn-projects-detail__content">
            {lessonsLoading && lessonsList.length === 0 ? (
              <div className="learn-syllabus-list__loading">
                <Skeleton active paragraph={{ rows: 4, width: ["100%", "90%", "80%", "70%"] }} />
              </div>
            ) : lessonsLoadError ? (
              <Alert
                type="error"
                showIcon
                message="Could not load course lessons"
                description={lessonsLoadError}
                action={<Button size="small" onClick={() => setRefresh((value) => !value)}>Retry</Button>}
              />
            ) : !loginUser?.classId ? (
              <div className="learn-syllabus-list__empty">
                <BookOutlined className="learn-syllabus-list__empty-icon" />
                <p>Not assigned to a class</p>
                <span>You need to be assigned to a class to view this course. Please contact your administrator.</span>
              </div>
            ) : lessonsList?.length === 0 ? (
              <div className="learn-syllabus-list__empty">
                <BookOutlined className="learn-syllabus-list__empty-icon" />
                <p>{modeLabels.emptyTitle}</p>
                <span>{modeLabels.emptyDescription}</span>
              </div>
            ) : (
              <>
                {(roadmapQuizError || submittedAssignmentsError || progressLoadError) && (
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message="Some course state could not be loaded"
                    description={[
                      roadmapQuizError ? "quiz list" : null,
                      submittedAssignmentsError ? "assignment completion" : null,
                      progressLoadError ? "content progress" : null,
                    ].filter(Boolean).join(", ") + ". The visible course content is kept, but completion/counts may be incomplete until you retry."}
                    action={<Button size="small" onClick={() => {
                      setRoadmapQuizRefreshKey((value) => value + 1);
                      fetchSubmittedAssignments();
                      fetchRoadmapProgress();
                    }}>Retry state</Button>}
                  />
                )}
                {(mode === "roadmap" || mode === "blueprint") && (
                  roadmapGroups.length > 0 ? (
                    <div className="learn-roadmap" aria-label="Course roadmap">
                      <div className="learn-roadmap__filters" role="group" aria-label="Roadmap content filters">
                        {ROADMAP_CONTENT_FILTERS.map(filter => (
                          <button
                            key={filter.key}
                            type="button"
                            className={`learn-roadmap__filter ${roadmapContentFilter === filter.key ? "learn-roadmap__filter--active" : ""}`}
                            aria-pressed={roadmapContentFilter === filter.key}
                            onClick={() => setRoadmapContentFilter(filter.key)}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                      <div className="learn-roadmap__list">
                        {roadmapGroups.map(({ lesson, lessonIndex, contents, breakdownItems }, roadmapIndex) => {
                          const lessonId = lesson?.lesson?.id ?? lesson?.lessonId ?? lesson?.lesson?.lesson_id;
                          const lessonOpen = expandedRoadmapLessons.has(lessonId);
                          const panelId = `roadmap-lesson-panel-${lessonId ?? lessonIndex}`;
                          const groupedItems = contents
                            .map((content, contentIndex) => ({
                              content,
                              contentIndex,
                              id: content?.id ?? content?.lessonContentId ?? content?.lesson_content_id,
                              type: normalizeContentType(content?.contentType ?? content?.content_type),
                              title: getContentTitle(content),
                              tab: getTabForContent(content),
                            }))
                            .filter(item => item.id != null && matchesRoadmapFilter(item.content, roadmapContentFilter));
                          const totalCount = contents.length;
                          const doneCount = isTeacherRole ? 0 : contents.filter(isContentComplete).length;
                          // "Current" is the first lesson with unfinished content — not the first
                          // card on screen. The old hardcoded roadmapIndex === 0 told a learner on
                          // lesson 9 that lesson 1 was their current step, and announced it to
                          // screen readers via aria-current. It also fired in faculty Blueprint
                          // mode, where a "current step" has no meaning at all.
                          const isCurrent = !isTeacherRole && lessonId != null && lessonId === currentRoadmapLessonId;
                          const lessonStatus = isTeacherRole || totalCount === 0
                            ? null
                            : doneCount === totalCount
                            ? { key: "done", label: "Completed" }
                            : doneCount > 0
                            ? { key: "progress", label: "In progress" }
                            : { key: "todo", label: "Not started" };
                          return (
                            <article
                              key={lessonId ?? `roadmap-lesson-${lessonIndex}`}
                              className={`learn-roadmap__card ${isCurrent ? "learn-roadmap__card--current" : ""} ${lessonOpen ? "learn-roadmap__card--open" : ""}`}
                              aria-current={isCurrent ? "step" : undefined}
                            >
                              <button
                                type="button"
                                className="learn-roadmap__toggle"
                                aria-expanded={lessonOpen}
                                aria-controls={panelId}
                                onClick={() => toggleRoadmapLesson(lessonIndex)}
                              >
                                <span className="learn-roadmap__number">{String(lessonIndex + 1).padStart(2, "0")}</span>
                                <span className="learn-roadmap__title-block">
                                  {/* Was <strong> inside <article>, so a 12-lesson screen exposed
                                      exactly one heading and heading-navigation yielded one stop. */}
                                  <h3>{lesson?.lesson?.lessonName || "Untitled lesson"}</h3>
                                </span>
                                {lessonStatus && (
                                  <span className="learn-roadmap__status-row">
                                    {isCurrent && <span className="learn-roadmap__status learn-roadmap__status--current">Continue here</span>}
                                    <span className={`learn-roadmap__status learn-roadmap__status--${lessonStatus.key}`}>{lessonStatus.label}</span>
                                    <span className="learn-roadmap__count">{doneCount}/{totalCount}</span>
                                  </span>
                                )}
                                <RightOutlined aria-hidden className={`learn-roadmap__chevron ${lessonOpen ? "learn-roadmap__chevron--open" : ""}`} />
                              </button>
                              {lessonOpen && (
                                <div className="learn-roadmap__content" id={panelId} role="region" aria-label={`Lesson ${lessonIndex + 1} contents`}>
                                  {isTeacherRole && (
                                    // A row of 5 labeled pill buttons ("ADD TO THIS LESSON") used to
                                    // sit BELOW the item list (CSS `order: 2`, deliberately, to avoid
                                    // layout shift on expand) — so on a lesson that already had
                                    // content, adding more meant scrolling past everything else
                                    // first. One compact button up top, with the same 5 types behind
                                    // a dropdown, is discoverable immediately and never pushes the
                                    // list around regardless of how many items are in it.
                                    <div className="learn-roadmap__add-bar">
                                      <Dropdown
                                        trigger={["click"]}
                                        menu={{
                                          items: ADD_CONTENT_OPTIONS.map(({ type, label, icon: Icon }) => ({
                                            key: type,
                                            label,
                                            icon: <Icon aria-hidden />,
                                            onClick: () => openAddContent(lessonIndex, type),
                                          })),
                                        }}
                                      >
                                        <Button
                                          size="small"
                                          icon={<PlusOutlined aria-hidden />}
                                          className="learn-roadmap__add-bar-btn"
                                          aria-label="Add content to this lesson"
                                        >
                                          Add content
                                        </Button>
                                      </Dropdown>
                                    </div>
                                  )}
                                  <div className="learn-roadmap__items">
                                    {groupedItems.length > 0 ? groupedItems.map(({ content, id, type, title, tab, contentIndex }) => {
                                      const tone = getRoadmapContentTone(type);
                                      const destinationLabel = getRoadmapDestinationLabel(tab);
                                      // Type was carried only by a 12%-alpha tint on the number
                                      // chip plus a 12px muted caption — the least salient thing in
                                      // the row — while CONTENT_ORDER already defined a real icon
                                      // per type and used it in other modes. "Find the quiz" should
                                      // be a saccade, not a read.
                                      const typeEntry = CONTENT_ORDER.find(c => c.key === type);
                                      const TypeIcon = typeEntry ? typeEntry.icon : null;
                                      const done = !isTeacherRole && isContentComplete(content);
                                      const expired = !isTeacherRole && !done && isExpiredUnsubmittedQuiz(type, content);
                                      const live = type === "live_class" ? liveSessionSchedule(content) : null;
                                      const rowDue = type === "quiz" || type === "assignment" ? roadmapDueInfo(content) : null;
                                      const quizDeadlineUnavailable = !isTeacherRole && !done && type === "quiz" && !rowDue;
                                      const overdue = !isTeacherRole && !done && type === "assignment" && rowDue?.past;
                                      // Faculty: a draft quiz is invisible to students -- say so on the row.
                                      const isDraftQuiz = isTeacherRole && type === "quiz" && String(content?.status || "").toUpperCase() === "DRAFT";
                                      const progressEntry = progressByContentId?.[content?.id ?? content?.lessonContentId ?? content?.lesson_content_id];
                                      const watchedPct = !isTeacherRole && !done && (type === "video" || type === "youtube") && progressEntry
                                        ? Math.round(Math.min(100, Math.max(0, Number(progressEntry.percentWatched) || 0)))
                                        : 0;
                                      const lessonRecord = lesson?.lesson ?? lesson;
                                      const learnerAccess = isTeacherRole
                                        ? { visible: true, actionable: true, reason: null }
                                        : learnerChildAvailability(lessonRecord, content);
                                      const locked = !isTeacherRole && learnerAccess.visible && !learnerAccess.actionable;
                                      return (
                                        <button
                                          key={id}
                                          type="button"
                                          className={`learn-roadmap__item learn-roadmap__item--${tone} ${done ? "learn-roadmap__item--done" : ""} ${expired ? "learn-roadmap__item--expired" : ""} ${locked ? "learn-roadmap__item--locked" : ""}`}
                                          aria-label={`${destinationLabel}: ${title}${done ? ", completed" : expired ? ", deadline passed, view answers" : locked ? ", locked" : quizDeadlineUnavailable ? ", unavailable, deadline missing" : ""}`}
                                          title={locked ? learnerAccess.reason : undefined}
                                          disabled={locked || quizDeadlineUnavailable}
                                          onClick={() => openRoadmapContent(lessonIndex, id)}
                                        >
                                          <span className="learn-roadmap__item-index" aria-hidden="true">
                                            {TypeIcon ? <TypeIcon /> : String(contentIndex + 1).padStart(2, "0")}
                                          </span>
                                          <span className="learn-roadmap__item-body">
                                            <h4>{title}</h4>
                                            <small>
                                              {getRoadmapContentLabel(type)}
                                              {live?.label ? ` · ${live.label}` : ""}
                                              {rowDue?.label ? ` · ${rowDue.past ? "Was due" : "Due"} ${rowDue.label}` : ""}
                                            </small>
                                          </span>
                                          {isDraftQuiz ? (
                                            <span className="learn-roadmap__item-ended">Draft · hidden from students</span>
                                          ) : locked ? (
                                            <span className="learn-roadmap__item-ended">Locked</span>
                                          ) : quizDeadlineUnavailable ? (
                                            <span className="learn-roadmap__item-ended">Unavailable · deadline missing</span>
                                          ) : done ? (
                                            <CheckCircleFilled className="learn-roadmap__item-done" aria-hidden="true" />
                                          ) : expired ? (
                                            <span className="learn-roadmap__item-expired">Missed</span>
                                          ) : live?.state === "live" ? (
                                            <span className="learn-roadmap__item-live">Live now</span>
                                          ) : live?.state === "ended" ? (
                                            <span className="learn-roadmap__item-ended">Ended</span>
                                          ) : overdue ? (
                                            <span className="learn-roadmap__item-overdue">Not submitted</span>
                                          ) : watchedPct > 0 ? (
                                            <span className="learn-roadmap__item-progress">{watchedPct}% watched</span>
                                          ) : null}
                                        </button>
                                      );
                                    }) : (
                                      // Was a flat "No content in this lesson yet." even when the
                                      // lesson had items the active filter had hidden — a false
                                      // statement — and it offered faculty nothing to do.
                                      <div className="learn-roadmap__empty-inline">
                                        {roadmapContentFilter !== "all" && contents.length > 0
                                          ? `No ${getFilterLabel(roadmapContentFilter)} in this lesson.`
                                          : isTeacherRole
                                          ? "Nothing here yet — use Add content above to add the first item."
                                          : "No content in this lesson yet."}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="learn-roadmap__empty">
                      <p>{modeLabels.emptyTitle}</p>
                      <span>{modeLabels.emptyDescription}</span>
                    </div>
                  )
                )}
              </>
            )}
          </section>
          </div>
        </div>
      ) : (
        <SyllabusDetail
          backToSyllabus={() => setOpenLessonView(false)}
          contentMode={mode}
          backLabel={modeLabels.backLabel}
          focusContentId={focusedContentId ?? (contentIdParam != null ? parseInt(contentIdParam, 10) : undefined)}
          previousLesson={
            currentLessonIndex == 0
              ? () => setOpenLessonView(false)
              : () =>
                  dispatch(
                    courseAction.setCurrentLessonIndex(currentLessonIndex - 1)
                  )
          }
          currentLesson={lessonsList[currentLessonIndex]?.lesson}
          nextLesson={() => {
            const len = lessonsList?.length ?? 0;
            if (currentLessonIndex != null && currentLessonIndex < len - 1) {
              dispatch(courseAction.setCurrentLessonIndex(currentLessonIndex + 1));
            }
          }}
          lastIndex={Array.isArray(lessonsList) && lessonsList.length > 0 && currentLessonIndex === lessonsList.length - 1}
        />
      )}
      {/* Assignments get their own Drawer (ViewAssignmentModal) instead of the generic Modal below —
          it's the current, multi-resource-aware assignment viewer (matches what the shared editor
          newAssignment.js actually produces) and already manages its own chrome/footer, so nesting
          it inside another Modal would double up the overlay. The bare `<Assignment>` component the
          generic Modal used to render here only ever read a single legacy file_dto/html_content
          pair and silently dropped any assignment with more than one resource. */}
      <ViewAssignmentModal
        open={selectedRoadmapContent?.type === "assignment"}
        onClose={closeRoadmapContent}
        assignmentContent={selectedRoadmapContent?.type === "assignment" ? selectedRoadmapContent?.content : null}
        insideSyllabus
      />
      <Modal
        open={!!selectedRoadmapContent && selectedRoadmapContent?.type !== "assignment"}
        onCancel={closeRoadmapContent}
        footer={null}
        // A Resource is a short list of materials; at 1120px its rows stretched into wide empty bands.
        width={selectedRoadmapContent?.type === "resource" || selectedRoadmapContent?.type === "live_class" ? "min(760px, 94vw)" : "min(1120px, 92vw)"}
        destroyOnClose
        centered
        title={selectedRoadmapContent ? getContentTitle(selectedRoadmapContent.content) : modeLabels.title}
        className="ln-roadmap-content-modal"
      >
        {selectedRoadmapContent ? (
          <RoadmapContentViewer
            item={selectedRoadmapContent}
            onClose={closeRoadmapContent}
            onContentChanged={() => { closeRoadmapContent(); setRefresh(!refresh); }}
            progress={progressByContentId[selectedRoadmapContent?.content?.id ?? selectedRoadmapContent?.content?.lessonContentId ?? selectedRoadmapContent?.content?.lesson_content_id]}
            onProgressUpdate={(updated) => setProgressForContent(
              selectedRoadmapContent?.content?.id ?? selectedRoadmapContent?.content?.lessonContentId ?? selectedRoadmapContent?.content?.lesson_content_id,
              updated
            )}
          />
        ) : (
          <div style={{ minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Spin />
          </div>
        )}
      </Modal>
      {isTeacherRole && (
        <>
          <AddNewLessonContentDrawer
            open={addContentType === "video" || addContentType === "resources" || addContentType === "live"}
            contentMode={addContentType === "video" ? "lectures" : addContentType === "resources" ? "resources" : addContentType === "live" ? "live" : undefined}
            onClose={closeAddContent}
            onContentAdded={onAddContentSaved}
          />
          <DrawerAssignment
            open={addContentType === "assignment"}
            onClose={closeAddContent}
            onSaved={onAddContentSaved}
            insideSyllabus
            lesson={addContentLesson}
          />
          <QuizBuilderModal
            open={addContentType === "quiz"}
            onClose={closeAddContent}
            onCreated={onAddContentSaved}
            lesson={addContentLesson}
            courseId={selectedCourseId}
            classId={loginUser?.classId}
          />
        </>
      )}
    </div>
  );
};

export default Syllabus;





