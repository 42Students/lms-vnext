import React, { useState } from "react";
import { useRouter } from "next/router";
import { Markup } from "interweave";
import {
  EditOutlined,
  FileTextOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { formatNotificationDate } from "@/utils/notificationDateUtils";

const LIMIT = 6;

const ANNOUNCEMENT_ALLOWED_TAGS = ['p', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'br', 'a', 'span'];
const ANNOUNCEMENT_ALLOWED_ATTRS = { a: ['href', 'target', 'rel'] };

function getCourseBasePath(router, courseIdentifier) {
  const routeText = String(router?.pathname || router?.asPath || "");
  const isTeacherRoute = routeText.includes("/teacher/");
  return `${isTeacherRoute ? "/teacher" : "/learn"}/courses/${courseIdentifier}`;
}

// There's no standalone assessments/live-sessions page for either role anymore — both deep-link
// into the unified content view (roadmap for learners, blueprint for faculty) with a ?filter=,
// same as Home.js's own routeToCourseTab.
function getFilteredTabPath(router, courseIdentifier, filterKey) {
  const routeText = String(router?.pathname || router?.asPath || "");
  const isTeacherRoute = routeText.includes("/teacher/");
  const tab = isTeacherRoute ? "blueprint" : "roadmap";
  return `${getCourseBasePath(router, courseIdentifier)}/${tab}?filter=${filterKey}`;
}

/**
 * Unified recent updates list: deadlines, course updates, sessions in one feed.
 * Sorted by urgency. Compact on desktop, stacked on mobile.
 */
export default function UnifiedActivityList({
  deadlines = [],
  announcements = [],
  sessions = [],
  loading,
  courseIdentifier,
}) {
  const router = useRouter();
  const [expandedAnnId, setExpandedAnnId] = useState(null);

  const items = [];
  (deadlines || []).slice(0, 3).forEach((d) =>
    items.push({
      ...d,
      itemType: "deadline",
      sortKey: d.dueDate?.getTime?.() ?? 0,
    })
  );
  (announcements || []).slice(0, 2).forEach((a) =>
    items.push({
      ...a,
      itemType: "announcement",
      sortKey: 0,
    })
  );
  (sessions || []).slice(0, 2).forEach((s) =>
    items.push({
      ...s,
      itemType: "session",
      sortKey: s.start?.getTime?.() ?? 0,
    })
  );

  items.sort((a, b) => {
    if (a.itemType === "deadline" && b.itemType === "deadline") return a.sortKey - b.sortKey;
    if (a.itemType === "session" && b.itemType === "session") return a.sortKey - b.sortKey;
    const order = { deadline: 0, announcement: 1, session: 2 };
    return (order[a.itemType] ?? 3) - (order[b.itemType] ?? 3);
  });

  const displayItems = items.slice(0, LIMIT);
  const hasDeadlines = (deadlines || []).length > 0;
  const hasAnnouncements = (announcements || []).length > 0;
  const hasSessions = (sessions || []).length > 0;
  const hasAny = hasDeadlines || hasAnnouncements || hasSessions || loading;

  if (!hasAny && !loading) return null;

  const handleDeadlineClick = (item) => {
    const basePath = courseIdentifier ? getCourseBasePath(router, courseIdentifier) : "";
    if (item?.taskUrl && courseIdentifier) {
      const normalizedTaskUrl = item.taskUrl
        .replace(/^\/learn\/courses\/[^/]+/, basePath)
        .replace(/^\/teacher\/courses\/[^/]+/, basePath);
      router.push(normalizedTaskUrl);
    } else if (courseIdentifier) {
      router.push(getFilteredTabPath(router, courseIdentifier, "assessments"));
    }
  };

  const handleSessionClick = () => {
    if (!courseIdentifier) return;
    router.push(getFilteredTabPath(router, courseIdentifier, "live-sessions"));
  };

  const handleAnnouncementExpand = (id) => {
    setExpandedAnnId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <section className="unified-activity" aria-label="Recent updates" aria-busy="true" role="status" aria-live="polite">
        <h3 className="unified-activity__title">Recent updates</h3>
        <span className="sr-only">Loading recent updates</span>
        <div className="unified-activity__skeleton" aria-hidden="true">
          <div className="unified-activity__skeleton-line" />
          <div className="unified-activity__skeleton-line" style={{ width: "75%" }} />
          <div className="unified-activity__skeleton-line" style={{ width: "60%" }} />
        </div>
      </section>
    );
  }

  return (
    <section className="unified-activity" aria-label="Recent updates">
      <h3 className="unified-activity__title">Recent updates</h3>
      <ul className="unified-activity__list">
        {displayItems.map((item, i) => {
          if (item.itemType === "deadline") {
            return (
              <li key={item.id ?? `d-${i}`} className="unified-activity__item">
                <button
                  type="button"
                  className="unified-activity__item-btn"
                  onClick={() => handleDeadlineClick(item)}
                  onKeyDown={(e) => e.key === "Enter" && handleDeadlineClick(item)}
                >
                  <span className="unified-activity__icon unified-activity__icon--deadline">
                    {item.type === "quiz" ? (
                      <FileTextOutlined aria-hidden />
                    ) : (
                      <EditOutlined aria-hidden />
                    )}
                  </span>
                  <span className="unified-activity__content">
                    <span className="unified-activity__label">
                      {item.type === "quiz" ? "Quiz" : "Assignment"} due {item.dueLabel}
                    </span>
                    <span className="unified-activity__meta">{item.contentTitle || "Untitled"}</span>
                  </span>
                  <RightOutlined className="unified-activity__arrow" aria-hidden />
                </button>
              </li>
            );
          }

          if (item.itemType === "announcement") {
            const msg = (item.message || "").trim();
            const isLong = msg.length > 100;
            const isExpanded = expandedAnnId === item.id;
            const preview = isLong && !isExpanded ? `${msg.slice(0, 100)}…` : msg;
            const announcementBodyId = `course-announcement-${String(item.id ?? i).replace(/[^a-zA-Z0-9_-]/g, "-")}`;

            return (
              <li key={item.id ?? `a-${i}`} className="unified-activity__item unified-activity__item--announcement">
                <span className="unified-activity__icon unified-activity__icon--announcement">
                  <MessageOutlined aria-hidden />
                </span>
                <div className="unified-activity__content unified-activity__content--announcement">
                  <span className="unified-activity__label">{item.title || "Course update"}</span>
                  <span className="unified-activity__meta">{formatNotificationDate(item.created_at)}</span>
                  {preview && (
                    <div id={announcementBodyId} className="unified-activity__body ln-tbl-markup">
                      <Markup content={preview || ''} allowList={ANNOUNCEMENT_ALLOWED_TAGS} allowAttributes={ANNOUNCEMENT_ALLOWED_ATTRS} />
                    </div>
                  )}
                  {isLong && (
                    <button
                      type="button"
                      className="unified-activity__expand"
                      onClick={() => handleAnnouncementExpand(item.id)}
                      aria-expanded={isExpanded}
                      aria-controls={announcementBodyId}
                      style={{ minHeight: "44px", minWidth: "44px" }}
                    >
                      {isExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              </li>
            );
          }

          if (item.itemType === "session") {
            return (
              <li key={item.id ?? `s-${i}`} className="unified-activity__item unified-activity__item--session">
                <button type="button" className="unified-activity__item-btn" onClick={handleSessionClick}>
                  <span className="unified-activity__icon unified-activity__icon--session">
                    <ClockCircleOutlined aria-hidden />
                  </span>
                  <span className="unified-activity__content">
                    <span className="unified-activity__label">{item.title || "Scheduled class"}</span>
                    <span className="unified-activity__meta">{item.startLabel || ""}</span>
                  </span>
                  <RightOutlined className="unified-activity__arrow" aria-hidden />
                </button>
              </li>
            );
          }

          return null;
        })}
      </ul>
      <div className="unified-activity__links">
        {courseIdentifier && hasDeadlines && (
          <button
            type="button"
            className="unified-activity__link"
            onClick={() => router.push(getFilteredTabPath(router, courseIdentifier, "assessments"))}
          >
            Assessments
          </button>
        )}
        {courseIdentifier && hasAnnouncements && (
          <button
            type="button"
            className="unified-activity__link"
            onClick={() => router.push(`${getCourseBasePath(router, courseIdentifier)}/discussions`)}
          >
            Discussions
          </button>
        )}
        {courseIdentifier && hasSessions && (
          <button type="button" className="unified-activity__link" onClick={handleSessionClick}>
            Live Sessions
          </button>
        )}
      </div>
    </section>
  );
}
