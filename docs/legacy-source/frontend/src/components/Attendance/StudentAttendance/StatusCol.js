import React from "react";
import { StatusBadge, STATUS_TONE } from "@/components/Common/PanelStates";

const ATTENDANCE_TONE = {
  PRESENT: STATUS_TONE.success,
  ABSENT: STATUS_TONE.error,
  LATE: STATUS_TONE.warning,
  EXCUSED: STATUS_TONE.info,
  LEAVE: STATUS_TONE.info,
};

const StatusCol = (props) => {
  const { statusClass = "", status = "" } = props;
  const normalized = String(status || "").trim().toUpperCase();

  return (
    <StatusBadge
      status={normalized || "unknown"}
      label={status || "Unknown"}
      tone={ATTENDANCE_TONE[normalized] || STATUS_TONE.neutral}
      className={statusClass}
    />
  );
};

export default StatusCol;
