import React from "react";
import { CheckCircleOutlined, PlayCircleOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { StatusBadge, STATUS_TONE } from "@/components/Common/PanelStates";

const STATUS_CONFIG = {
  WATCHED: { status: "evaluated", label: "Completed", tone: STATUS_TONE.success, icon: CheckCircleOutlined },
  COMPLETED: { status: "evaluated", label: "Completed", tone: STATUS_TONE.success, icon: CheckCircleOutlined },
  SUBMITTED: { status: "submitted", label: "Submitted", tone: STATUS_TONE.info, icon: CheckCircleOutlined },
  GRADED: { status: "evaluated", label: "Graded", tone: STATUS_TONE.success, icon: CheckCircleOutlined },
  IN_PROGRESS: { status: "active", label: "In progress", tone: STATUS_TONE.info, icon: PlayCircleOutlined },
  NOT_STARTED: { status: "pending", label: "Not started", tone: STATUS_TONE.neutral, icon: MinusCircleOutlined },
};

/**
 * Progress bar (full width at bottom) + status badge for a video/content tile.
 * @param {Object} progress - { status: 'NOT_STARTED'|'IN_PROGRESS'|'WATCHED', percentWatched: number }
 * @param {boolean} compact - smaller badge and bar for mobile
 */
export default function ContentProgressBadge({ progress, compact = false }) {
  if (progress == null || typeof progress !== "object") return null;
  const status = (progress.status || "NOT_STARTED").toUpperCase().replace(/[\s-]/g, "_");
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_STARTED;
  const rawPercent = Number(progress.percentWatched);
  const percent = Number.isFinite(rawPercent) ? Math.min(100, Math.max(0, Math.round(rawPercent))) : 0;
  const Icon = config.icon;

  return (
    <div
      className="content-progress-badge"
      style={{
        marginTop: compact ? 8 : 12,
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 4,
        }}
      >
        <StatusBadge
          status={config.status}
          label={config.label}
          tone={config.tone}
          icon={<Icon style={{ fontSize: compact ? 12 : 14 }} aria-hidden="true" />}
          className={compact ? "content-progress-badge__status content-progress-badge__status--compact" : "content-progress-badge__status"}
        />
        {percent > 0 && percent < 100 && (
          <span style={{ fontSize: compact ? 12 : 13, color: "#6b7280", fontWeight: 500 }}>
            {percent}% watched
          </span>
        )}
      </div>
      <div
        style={{
          height: compact ? 3 : 4,
          borderRadius: 2,
          background: "#e5e9f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            background: config.tone === STATUS_TONE.success ? "#059669" : config.tone === STATUS_TONE.info ? "#26bac7" : "#6b7280",
            borderRadius: 2,
            transition: "width 0.25s ease",
          }}
        />
      </div>
    </div>
  );
}
