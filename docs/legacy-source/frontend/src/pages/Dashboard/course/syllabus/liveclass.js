import React from "react";
import { Button, message, Popconfirm } from "antd";
import {
  VideoCameraOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import deleteLessonContent from "../../../../utils/courseUtils/syllabusUtils";
import ContentTitle, { ContentAddedDate } from "@/components/Course/Syllabus/ContentTitle";
import MarkCompleteButton from "@/components/Course/Syllabus/MarkCompleteButton";

// Recognisable name for the meeting provider, so "Join Meeting" says where it is going.
function meetingProvider(link) {
  try {
    const host = new URL(link).hostname.toLowerCase();
    if (host.includes("zoom")) return "Zoom";
    if (host.includes("meet.google")) return "Google Meet";
    if (host.includes("teams")) return "Microsoft Teams";
    if (host.includes("webex")) return "Webex";
    if (host.includes("whereby")) return "Whereby";
    return host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function humanizeUntil(target) {
  const minutes = Math.max(0, Math.round(target.diff(dayjs(), "minute", true)));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h${minutes % 60 ? ` ${minutes % 60} min` : ""}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

/** Learning Path card helper: status + schedule for a live session row. */
export function liveSessionSchedule(content) {
  const data = content?.contentDataDTO || content?.content_data_dto || {};
  const start = data.start_time ? dayjs(data.start_time) : null;
  const end = data.end_time ? dayjs(data.end_time) : null;
  const validStart = start && start.isValid() ? start : null;
  const validEnd = end && end.isValid() ? end : null;
  const now = dayjs();
  let state = "scheduled";
  if (validEnd && validEnd.isBefore(now)) state = "ended";
  else if (validStart && !validStart.isAfter(now) && (!validEnd || validEnd.isAfter(now))) state = "live";
  else if (validStart && validStart.isAfter(now)) state = "upcoming";
  const label = validStart
    ? `${validStart.format("DD MMM")}, ${validStart.format("h:mm A")}${validEnd ? ` – ${validEnd.format("h:mm A")}` : ""}`
    : null;
  return { state, label, start: validStart, end: validEnd };
}

const LiveClassContent = ({
  content,
  refreshAllContent,
  contentType = "Live Class",
  deleteType = "LIVE_CLASS",
  progress,
  onProgressUpdate,
  progressUnavailable = false,
  inModal = false,
}) => {
  const meetLink = content?.contentDataDTO?.link || content?.contentUrl;
  const loginUser = useSelector(state => state.loginUser);
  const isFacultyRole = loginUser?.userType === "FACULTY" || loginUser?.userType === "ADMIN";
  const isLearner = loginUser?.userType === "LEARNER";
  const contentId = content?.id ?? content?.lessonContentId ?? content?.lesson_content_id;

  const handleJoinMeeting = () => {
    if (meetLink) {
      window.open(meetLink, "_blank", "noopener,noreferrer");
    } else {
      message.warning("The meeting link isn't available yet.");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetLink);
      message.success("Meeting link copied");
    } catch {
      message.error("Couldn't copy the link");
    }
  };

  const rawScheduleDate = content?.contentDataDTO?.date || content?.contentDataDTO?.schedule_date;
  const rawStartTime = content?.contentDataDTO?.start_time;
  const rawEndTime = content?.contentDataDTO?.end_time;

  const startDay = (() => {
    const candidate = dayjs(rawScheduleDate || rawStartTime);
    return candidate.isValid() ? candidate : null;
  })();
  const start = rawStartTime && dayjs(rawStartTime).isValid() ? dayjs(rawStartTime) : null;
  const end = rawEndTime && dayjs(rawEndTime).isValid() ? dayjs(rawEndTime) : null;
  const durationMinutes = start && end ? end.diff(start, "minute") : null;

  // #11: "Join Meeting" was always shown and always clickable, with zero awareness of end_time --
  // the link just sat there after the session was long over, with no indication it was dead.
  // end_time is always a full "YYYY-MM-DD HH:mm:ss" datetime (see the create form's
  // buildDateTimeString), not a bare time, so comparing it directly against now is safe. Missing
  // end_time (older/incomplete records) falls back to NOT gating -- an unknown end time shouldn't
  // hide a possibly-still-relevant link. Faculty are never gated: the person actually running the
  // session needs to be able to rejoin a call that overran its scheduled end time, unlike a
  // student for whom a dead-looking link after the fact is just confusing.
  const sessionHasEnded = !isFacultyRole && rawEndTime
    ? dayjs(rawEndTime).isValid() && dayjs(rawEndTime).isBefore(dayjs())
    : false;

  const now = dayjs();
  const status = end && end.isBefore(now)
    ? { tone: "ended", label: "Ended" }
    : start && !start.isAfter(now)
      ? { tone: "live", label: "Live now" }
      : start
        ? { tone: "upcoming", label: `Starts in ${humanizeUntil(start)}` }
        : { tone: "scheduled", label: "Scheduled" };
  const provider = meetLink ? meetingProvider(meetLink) : null;

  return (
    <div className={`ln-live-view${inModal ? " ln-live-view--modal" : ""}`}>
      <div className="ln-live-view__head">
        {inModal ? (
          <span className="ln-live-view__type"><VideoCameraOutlined aria-hidden="true" /> Live session</span>
        ) : (
          <ContentTitle content={content} contentType={contentType} />
        )}
        <div className="ln-live-view__head-actions">
          {isFacultyRole && (
            <Popconfirm
              title="Delete the live class"
              description="Are you sure you want to delete this live class?"
              onConfirm={() => {
                deleteLessonContent(deleteType, content, loginUser?.id)
                  .then(() => {
                    message.success("Live class deleted successfully");
                    setTimeout(() => refreshAllContent?.(), 1000);
                  })
                  .catch(() => {
                    message.error("Failed to delete");
                  });
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" danger icon={<DeleteOutlined />} aria-label="Delete live class" />
            </Popconfirm>
          )}
          <ContentAddedDate content={content} />
        </div>
      </div>

      <div className={`ln-live-view__card ln-live-view__card--${status.tone}`}>
        {startDay ? (
          <div className="ln-live-view__date" aria-hidden="true">
            <span className="ln-live-view__date-month">{startDay.format("MMM")}</span>
            <span className="ln-live-view__date-day">{startDay.format("D")}</span>
            <span className="ln-live-view__date-weekday">{startDay.format("ddd")}</span>
          </div>
        ) : null}
        <div className="ln-live-view__info">
          <span className={`ln-live-view__status ln-live-view__status--${status.tone}`}>
            {status.tone === "live" ? <span className="ln-live-view__pulse" aria-hidden="true" /> : null}
            {status.label}
          </span>
          {start ? (
            <span className="ln-live-view__time">
              <ClockCircleOutlined aria-hidden="true" />
              {startDay ? `${startDay.format("dddd, DD MMM YYYY")} · ` : ""}
              {start.format("h:mm A")}
              {end ? ` – ${end.format("h:mm A")}` : ""}
              {durationMinutes > 0 ? <span className="ln-live-view__duration">{durationMinutes} min</span> : null}
            </span>
          ) : startDay ? (
            <span className="ln-live-view__time">{startDay.format("dddd, DD MMM YYYY")}</span>
          ) : null}
          {meetLink && provider ? <span className="ln-live-view__provider">on {provider}</span> : null}
        </div>
      </div>

      {meetLink ? (
        <div className="ln-live-view__join">
          <p className="ln-live-view__join-text">
            {sessionHasEnded
              ? "This session has already ended."
              : status.tone === "live"
                ? "The session is live. Join now."
                : "A live class session is available. Click the button to join."}
          </p>
          <div className="ln-live-view__join-actions">
            {!sessionHasEnded ? (
              <Button icon={<CopyOutlined />} onClick={handleCopyLink} aria-label="Copy meeting link" />
            ) : null}
            {sessionHasEnded ? (
              <Button disabled size="large" icon={<VideoCameraOutlined />} className="ln-live-view__join-btn">
                Session ended
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                icon={<VideoCameraOutlined />}
                onClick={handleJoinMeeting}
                className="ln-live-view__join-btn"
              >
                Join Meeting
              </Button>
            )}
          </div>
        </div>
      ) : (
        <p className="ln-live-view__empty">
          No meeting link available yet. The link will appear here once the session is scheduled.
        </p>
      )}

      {isLearner && (
        <div className="ln-live-view__footer">
          <span className="ln-live-view__footer-hint">Attended this session?</span>
          <MarkCompleteButton lessonContentId={contentId} progress={progress} onProgressUpdate={onProgressUpdate} disabled={progressUnavailable} disabledReason="Completion status could not be verified. Retry lesson state before marking this item complete." />
        </div>
      )}
    </div>
  );
};

export default LiveClassContent;
