import { useState, useEffect, useCallback, useRef } from "react";
import { getLessonList } from "@/api/Services/courseServices";
import { getNotifications } from "@/api/Services/notificationService";
import { getCalenderEvents } from "@/api/Services/calenderServices";
import moment from "moment";

const WIDGET_LIMIT_DEADLINES = 5;
const WIDGET_LIMIT_ANNOUNCEMENTS = 2;
const WIDGET_LIMIT_SESSIONS = 3;
const SESSIONS_DAYS_AHEAD = 14;
const DEADLINES_DAYS_AHEAD = 14;

/**
 * Safely parse a date string. Returns moment or null.
 * Handles: null, undefined, empty string, invalid dates.
 */
function safeParseDate(raw) {
  if (raw == null || raw === "") return null;
  const m = moment.utc(raw).local();
  return m.isValid() ? m : null;
}

/**
 * Extract upcoming task deadlines from lesson list (quiz/assignment with due_date in next 14 days).
 * Edge cases: null/empty lessons, missing contentType, various due date field names,
 * past/invalid dates, duplicate content, missing lessonId/contentId, malformed contentData.
 */
function extractUpcomingDeadlines(lessonsList, courseIdentifier) {
  const now = moment().startOf("day");
  const cutoff = moment().add(DEADLINES_DAYS_AHEAD, "days").endOf("day");
  const items = [];
  const seen = new Set();

  if (!Array.isArray(lessonsList) || lessonsList.length === 0) return items;

  for (const lesson of lessonsList) {
    if (!lesson || typeof lesson !== "object") continue;
    const lessonId = lesson?.lesson?.id ?? lesson?.lessonId;
    const lessonName = lesson?.lesson?.lessonName ?? lesson?.lesson?.lesson_name ?? "Lesson";
    const contents = lesson?.lessonContents ?? lesson?.lesson_contents ?? lesson?.contents ?? [];

    if (!Array.isArray(contents)) continue;

    for (const content of contents) {
      if (!content || typeof content !== "object") continue;
      const contentType = String(content?.contentType ?? content?.content_type ?? "").toLowerCase();
      const isQuiz = contentType === "quiz";
      const isAssignment = contentType === "assignment";
      if (!isQuiz && !isAssignment) continue;

      const contentData = content?.contentDataDTO ?? content?.content_data_dto ?? content?.contentData ?? content?.content_data ?? {};
      const rawDue = contentData?.due_date ?? contentData?.dueDate ?? contentData?.end_time ?? contentData?.endTime ?? contentData?.endDate;
      const dueMoment = safeParseDate(rawDue);
      if (!dueMoment) continue;
      const dueDate = dueMoment.toDate();
      if (dueDate <= now.toDate() || dueDate > cutoff.toDate()) continue;

      const contentId = content?.id ?? content?.lessonContentId ?? content?.lesson_content_id;
      const contentTitle = String(content?.contentTitle ?? content?.content_title ?? "Untitled").trim() || "Untitled";
      const key = `${lessonId ?? "?"}-${contentId ?? "?"}`;
      if (seen.has(key)) continue;
      seen.add(key);

      items.push({
        id: key,
        lessonId,
        contentId,
        contentTitle,
        lessonName,
        type: isQuiz ? "quiz" : "assignment",
        dueDate,
        dueLabel: dueMoment.format("MMM D, YYYY"),
        taskUrl:
          courseIdentifier && lessonId != null && contentId != null && !Number.isNaN(Number(lessonId)) && !Number.isNaN(Number(contentId))
            ? `/learn/courses/${courseIdentifier}/roadmap?lesson=${lessonId}&content=${contentId}`
            : courseIdentifier
              ? `/learn/courses/${courseIdentifier}/roadmap`
              : null,
      });
    }
  }

  return items
    .sort((a, b) => (a.dueDate?.getTime?.() ?? 0) - (b.dueDate?.getTime?.() ?? 0))
    .slice(0, WIDGET_LIMIT_DEADLINES);
}

/**
 * Normalize announcement list and take last N (by id descending, then by created_at if available).
 * Edge cases: null/undefined array, missing id/title/message, duplicate ids.
 */
function extractRecentAnnouncements(notifications, limit = WIDGET_LIMIT_ANNOUNCEMENTS) {
  if (!Array.isArray(notifications)) return [];
  // This widget renders every item as a generic, untyped "Course update" — fine for genuine
  // announcements, but this fetch pulls from the same Notification table as the main
  // Notifications page, which also carries COURSE/JOB/PROJECT/SYSTEM-typed rows. Without this
  // filter, any of those would silently show up here as an indistinguishable "announcement" the
  // moment they're correctly typed, duplicating (with no type badge) what the main page already
  // shows in its own dedicated tab. Legacy rows with no notification_type at all are kept —
  // that's the pre-taxonomy shape this widget originally targeted.
  const arr = notifications
    .filter((a) => a != null && typeof a === "object")
    .filter((a) => {
      const type = a?.notification_type ?? a?.notificationType;
      return type == null || type === "GENERAL";
    });
  return [...arr]
    .sort((a, b) => {
      const aId = a?.id;
      const bId = b?.id;
      if (aId != null && bId != null) return Number(bId) - Number(aId);
      const aTime = a?.created_at ?? a?.createdAt;
      const bTime = b?.created_at ?? b?.createdAt;
      if (aTime && bTime) return new Date(bTime).getTime() - new Date(aTime).getTime();
      return 0;
    })
    .slice(0, limit)
    .map((a, i) => ({
      id: a?.id ?? `announcement-${i}`,
      title: String(a?.title ?? "Announcement").trim() || "Announcement",
      message: String(a?.message ?? "").trim(),
      created_at: a?.created_at ?? a?.createdAt,
    }));
}

/**
 * Filter calendar events by course and take next N.
 * Edge cases: nested response (data.data), null/undefined, various field names,
 * past sessions, missing start/end, course matching by id or slug.
 */
function extractUpcomingSessions(eventsRaw, courseId, courseSlug, limit = WIDGET_LIMIT_SESSIONS) {
  let list = [];
  if (Array.isArray(eventsRaw)) {
    list = eventsRaw;
  } else if (eventsRaw && typeof eventsRaw === "object") {
    list = Array.isArray(eventsRaw.data) ? eventsRaw.data : Array.isArray(eventsRaw.events) ? eventsRaw.events : [];
  }

  const now = moment();
  const hasCourseFilter = (courseId != null && courseId !== "") || (courseSlug != null && courseSlug !== "");

  const byCourse = hasCourseFilter
    ? list.filter((ele) => {
        if (!ele || typeof ele !== "object") return false;
        const cid = ele?.courseId ?? ele?.course_id;
        const slug = ele?.courseSlug ?? ele?.course_slug;
        if (courseId != null && cid != null && !Number.isNaN(Number(courseId)) && Number(cid) === Number(courseId))
          return true;
        if (courseSlug && slug && String(slug).trim() === String(courseSlug).trim()) return true;
        return false;
      })
    : list.filter((ele) => ele != null && typeof ele === "object");

  const parsed = [];
  const seen = new Set();

  for (const ele of byCourse) {
    const start = safeParseDate(ele?.startTime ?? ele?.start_time);
    if (!start || !start.isSameOrAfter(now)) continue;

    const id = ele?.classScheduleId ?? ele?.id ?? ele?.startTime ?? `session-${parsed.length}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const courseName = ele?.courseName ?? ele?.course_name ?? "";
    const scheduleTitle = ele?.title ?? "";
    const className = ele?.className ?? ele?.class_name ?? "";
    let displayTitle = scheduleTitle || courseName || "Scheduled Class";
    if (scheduleTitle && courseName && scheduleTitle !== courseName) {
      displayTitle = `${scheduleTitle} · ${courseName}`;
    }
    if (className && !displayTitle.includes(className)) {
      displayTitle += ` (${className})`;
    }

    parsed.push({
      id,
      title: String(displayTitle).trim() || "Scheduled Class",
      start: start.toDate(),
      startLabel: start.format("ddd, MMM D [at] h:mm A"),
      end: safeParseDate(ele?.endTime ?? ele?.end_time)?.toDate?.() ?? null,
    });
  }

  return parsed
    .sort((a, b) => (a.start?.getTime?.() ?? 0) - (b.start?.getTime?.() ?? 0))
    .slice(0, limit);
}

/**
 * Hook to fetch upcoming deadlines, recent announcements, and upcoming class sessions
 * for the course home page. Handles all edge cases: missing params, empty data, API errors.
 *
 * @param {Object} params
 * @param {string} [params.courseSlug]
 * @param {number} [params.courseId]
 * @param {number} [params.classId]
 * @param {boolean} [params.isLearner] - if false, skips learner-only widgets
 */
export function useCourseHomeWidgets({ courseSlug, courseId, classId, isLearner = true }) {
  const [deadlines, setDeadlines] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const loadedScopeRef = useRef(null);

  const courseIdentifier =
    (courseSlug != null && courseSlug !== "" ? String(courseSlug) : null) ??
    (courseId != null && String(courseId) !== "" && !Number.isNaN(Number(courseId)) ? String(courseId) : null);
  const hasClassId = classId != null && classId !== "";
  const canFetch = courseIdentifier && isLearner;
  const canFetchDeadlines = canFetch && hasClassId;
  const canFetchAnnouncements = canFetch && hasClassId;
  const canFetchSessions = canFetch && hasClassId;
  const widgetScopeKey = canFetch
    ? JSON.stringify([courseIdentifier, hasClassId ? String(classId) : "", isLearner])
    : null;

  const fetchAll = useCallback(() => {
    if (!canFetch || !widgetScopeKey) {
      loadedScopeRef.current = null;
      setDeadlines([]);
      setAnnouncements([]);
      setSessions([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    const scopeChanged = loadedScopeRef.current !== widgetScopeKey;
    if (scopeChanged) {
      setDeadlines([]);
      setAnnouncements([]);
      setSessions([]);
    }
    setLoading(true);
    setError(null);
    const markWidgetError = () => {
      setError((prev) => prev ?? new Error("Some course activity data could not be loaded."));
    };

    const promises = [];

    if (canFetchDeadlines) {
      const paramsLesson = courseSlug ? { courseSlug, classId } : { courseId, classId };
      promises.push(
        getLessonList(paramsLesson, { signal })
          .then((res) => {
            if (signal?.aborted) return;
            const raw = res?.data?.data ?? res?.data ?? res ?? [];
            const data = Array.isArray(raw) ? raw : [];
            const items = extractUpcomingDeadlines(data, courseIdentifier);
            setDeadlines(items);
          })
          .catch(() => {
            if (signal?.aborted) return;
            if (scopeChanged) setDeadlines([]);
            markWidgetError();
          })
      );
    } else {
      setDeadlines([]);
    }

    if (canFetchAnnouncements) {
      const notifParams = courseSlug ? { classId, courseSlug } : { classId, courseId };
      promises.push(
        getNotifications(notifParams, { signal })
          .then((res) => {
            if (signal?.aborted) return;
            const raw = res?.data ?? res ?? [];
            const list = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.data) ? raw.data : []);
            setAnnouncements(extractRecentAnnouncements(list));
          })
          .catch(() => {
            if (signal?.aborted) return;
            if (scopeChanged) setAnnouncements([]);
            markWidgetError();
          })
      );
    } else {
      setAnnouncements([]);
    }

    if (canFetchSessions) {
      const startDate = moment().format("YYYY-MM-DD");
      const endDate = moment().add(SESSIONS_DAYS_AHEAD, "days").format("YYYY-MM-DD");
      const calendarParams = { startDate, endDate, classId };
      promises.push(
        getCalenderEvents(calendarParams, false, signal)
          .then((eventRes) => {
            if (signal?.aborted) return;
            const items = extractUpcomingSessions(eventRes, courseId, courseSlug);
            setSessions(items);
          })
          .catch(() => {
            if (signal?.aborted) return;
            if (scopeChanged) setSessions([]);
            markWidgetError();
          })
      );
    } else {
      setSessions([]);
    }

    if (promises.length === 0) {
      loadedScopeRef.current = widgetScopeKey;
      setLoading(false);
    } else {
      Promise.allSettled(promises).finally(() => {
        if (!signal?.aborted) {
          loadedScopeRef.current = widgetScopeKey;
          setLoading(false);
        }
      });
    }
  }, [courseSlug, courseId, classId, canFetch, canFetchDeadlines, canFetchAnnouncements, canFetchSessions, courseIdentifier, isLearner, widgetScopeKey]);

  useEffect(() => {
    fetchAll();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchAll]);

  return {
    deadlines,
    announcements,
    sessions,
    loading,
    error,
    refetch: fetchAll,
    hasDeadlines: deadlines.length > 0,
    hasAnnouncements: announcements.length > 0,
    hasSessions: sessions.length > 0,
    missingClassId: isLearner && !hasClassId,
  };
}
