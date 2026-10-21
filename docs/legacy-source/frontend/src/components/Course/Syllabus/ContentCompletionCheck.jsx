import React from "react";
import { CheckCircleFilled } from "@ant-design/icons";

/**
 * Small completion checkmark for content items with a "done" status.
 * Renders nothing if not complete.
 *
 * `isComplete` takes precedence when passed -- it's how a caller reports completion for content
 * types (quiz submitted, assignment submitted) that have no `progress` row of their own to read a
 * `status` off of. `progress` alone remains supported for existing callers.
 */
export default function ContentCompletionCheck({ progress, isComplete }) {
  if (typeof isComplete !== "boolean") {
    if (!progress || typeof progress !== "object") return null;
    const status = (progress.status || "").toUpperCase().replace(/[\s-]/g, "_");
    const DONE = new Set(["WATCHED", "COMPLETED", "SUBMITTED", "GRADED", "DONE", "FINISHED"]);
    isComplete = DONE.has(status);
  }
  if (!isComplete) return null;

  return (
    <span
      className="content-completion-check"
      aria-label="Completed"
      title="Completed"
    >
      <CheckCircleFilled />
    </span>
  );
}
