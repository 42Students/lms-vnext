import React from "react";
import { useSelector } from "react-redux";
import {
  PlayCircleOutlined,
  YoutubeOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  FormOutlined,
  SolutionOutlined,
} from "@ant-design/icons";

function formatAddedDate(content) {
  const raw = content?.createdAt ?? content?.created_at;
  if (raw == null) return null;
  try {
    if (typeof raw === "string") {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return null;
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }
    if (Array.isArray(raw) && raw.length >= 3) {
      const [y, m, d] = raw;
      const month1 = typeof m === "number" ? m : Number(m) + 1;
      const date = new Date(Number(y), month1 - 1, Number(d));
      if (Number.isNaN(date.getTime())) return null;
      return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }
  } catch (_) {
    return null;
  }
  return null;
}

const LIVE_CONFIG = { icon: VideoCameraOutlined, color: "#26bac7", bg: "rgba(38,186,199,0.08)", label: "Live Class" };

// Keyed by the contentType prop each viewer passes: video.js "Video", youtube.js "YouTube Video",
// resource.js "Resource", liveclass.js "Live Class" (or the roadmap's "Live session" label).
const CONTENT_TYPE_CONFIG = {
  Video:           { icon: PlayCircleOutlined,  color: "#26bac7", bg: "rgba(38,186,199,0.08)",  label: "Video" },
  "YouTube Video": { icon: YoutubeOutlined,     color: "#ef4444", bg: "rgba(239,68,68,0.08)",   label: "YouTube" },
  Resource:        { icon: FileTextOutlined,    color: "#6b7280", bg: "rgba(107,114,128,0.08)", label: "Resource" },
  Quiz:            { icon: FormOutlined,        color: "#4338ca", bg: "rgba(99,102,241,0.10)",  label: "Quiz" },
  Assignment:      { icon: SolutionOutlined,    color: "#7c3aed", bg: "rgba(139,92,246,0.10)",  label: "Assignment" },
  "Live Class":    LIVE_CONFIG,
  "Live session":  LIVE_CONFIG,
};

const DEFAULT_CONFIG = { icon: FileTextOutlined, color: "#6b7280", bg: "#f1f4f9", label: "Content" };

function ContentTitle({ content, contentType }) {
  const loginUser = useSelector(state => state.loginUser);
  const { classNames = {} } = useSelector(
    state => state?.course?.currAdminCourse || {}
  );
  const isLearner = loginUser?.userType === "LEARNER";
  const isSharedContent = !(content?.classId > 0);

  const config = CONTENT_TYPE_CONFIG[contentType] || DEFAULT_CONFIG;
  const IconComponent = config.icon;

  return (
    <div className="ln-card-subtitle" style={{ alignItems: "center" }}>
      <span
        className="ln-content-type-badge"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 6,
          background: config.bg,
          color: config.color,
          fontSize: 13,
          fontWeight: 600,
          lineHeight: "18px",
          marginRight: 8,
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        <IconComponent style={{ fontSize: 14 }} />
        {config.label}
      </span>
      <h6 className="fw-600 mb-0 fnt-16 clrB517" style={{ lineHeight: "22px", wordBreak: "break-word" }}>
        {content?.contentTitle}
      </h6>
      {loginUser?.facultyType === "ADMIN" && (
        <span style={{ color: "#6b7280", fontSize: 13, marginLeft: 8, whiteSpace: "nowrap" }}>
          {/* Who sees it: "Admin"/"Teacher" stood for shared vs section content and read as an author. */}
          {`| ${!content?.classId || content?.classId < 1 ? "All sections" : (classNames[content?.classId] || "One section")}`}
        </span>
      )}
      {isLearner && (
        <span
          style={{
            marginLeft: 10,
            padding: "2px 8px",
            borderRadius: 999,
            fontSize: 12,
            lineHeight: "18px",
            color: isSharedContent ? "#0f766e" : "#1d4ed8",
            background: isSharedContent ? "rgba(20,184,166,0.12)" : "rgba(59,130,246,0.12)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {isSharedContent ? "Shared with your class" : "For your class"}
        </span>
      )}
    </div>
  );
}

/**
 * Subtle date-only label for "when this content was added". Render as the rightmost element in the lesson content header.
 * Desktop: 11px; mobile: scales down slightly so it stays readable but subtle.
 */
export function ContentAddedDate({ content }) {
  const value = formatAddedDate(content);
  if (!value) return null;
  return (
    <span
      className="content-added-date"
      style={{
        fontSize: 11,
        color: "#a9a7ae",
        fontWeight: 400,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {value}
    </span>
  );
}

export default ContentTitle;
