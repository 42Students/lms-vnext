import { formatTrackerDate } from "@/utils/bugTrackerUtils";
import { resolutionLabel, statusLabel } from "@/data/bugTrackerData";

function activityText(item) {
  if (item.activityType === "RETEST") {
    return item.toValue === "CLOSED / FIXED"
      ? "Retest passed — issue closed"
      : "Retest failed — returned to Fixing";
  }
  if (item.activityType === "STATUS_CHANGED") {
    return `Status changed from ${statusLabel(item.fromValue)} to ${statusLabel(item.toValue)}`;
  }
  if (item.activityType === "RESOLUTION_CHANGED") {
    const from = resolutionLabel(item.fromValue) || "None";
    const to = resolutionLabel(item.toValue) || "None";
    return `Resolution changed from ${from} to ${to}`;
  }
  return item.activityType || "Activity";
}

export default function ActivityTimeline({ items = [] }) {
  if (!items.length) return null;

  return (
    <section className="tracker-detail-card">
      <p className="tracker-eyebrow">Activity</p>
      <div className="tracker-activity-list">
        {items.map((item, index) => (
          <div className="tracker-activity-item" key={item.id || index}>
            <span className="tracker-activity-dot" aria-hidden="true" />
            <div>
              <strong>{activityText(item)}</strong>
              <small>
                {item.actorName ? `${item.actorName} · ` : ""}
                {formatTrackerDate(item.createdAt)}
              </small>
              {item.note && <p>{item.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
