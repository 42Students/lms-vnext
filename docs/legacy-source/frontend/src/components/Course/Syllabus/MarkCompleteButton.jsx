import { useRef, useState } from "react";
import { Button, message } from "antd";
import { CheckCircleFilled, CheckOutlined } from "@ant-design/icons";
import { saveContentProgress } from "@/api/Services/courseServices";

/**
 * Self-report "Mark as Complete" for content with no watched-percentage or submission of its own
 * (Resource, Live Class). The backend already trusts a
 * bare {completed: true} for these types (see LearnerContentProgressServiceImpl's
 * isTimedContentType check) -- there was simply no UI anywhere that ever sent it, so these content
 * types could never contribute to a lesson's "done" count no matter what the learner did.
 */
export default function MarkCompleteButton({ lessonContentId, progress, onProgressUpdate, disabled = false, disabledReason = null }) {
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const isComplete = Boolean(progress?.completedAt) || progress?.status === "WATCHED";

  if (!lessonContentId || lessonContentId <= 0) return null;

  if (isComplete) {
    return (
      <div className="mark-complete-button mark-complete-button--done">
        <CheckCircleFilled /> Marked as complete
      </div>
    );
  }

  const markComplete = async () => {
    if (disabled || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const res = await saveContentProgress({ lessonContentId, completed: true });
      const data = res?.data?.data ?? res?.data;
      onProgressUpdate?.(data && typeof data === "object" ? data : { status: "WATCHED", completedAt: new Date().toISOString() });
    } catch (error) {
      message.error(error?.response?.data?.message || "Could not mark this as complete. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="mark-complete-button">
      <Button size="small" icon={<CheckOutlined />} loading={saving} disabled={disabled || saving} title={disabled ? disabledReason || "Completion state is unavailable. Retry the lesson state first." : undefined} onClick={markComplete}>
        Mark as complete
      </Button>
    </div>
  );
}
