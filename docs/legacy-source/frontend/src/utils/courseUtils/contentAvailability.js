const HIDDEN_STATUSES = new Set(["DRAFT", "UNPUBLISHED", "HIDDEN", "DISABLED", "INACTIVE"]);

function explicitFalse(value) {
  return value === false || value === 0 || value === "0" || String(value).toLowerCase() === "false";
}

function explicitTrue(value) {
  return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
}

function recordsFor(entity) {
  if (!entity || typeof entity !== "object" || Array.isArray(entity)) return [];
  const nested = [entity.lesson, entity.course, entity.content].filter(
    (value) => value && typeof value === "object" && !Array.isArray(value)
  );
  return [entity, ...nested];
}

function firstReason(records) {
  const keys = [
    "lockReason",
    "lock_reason",
    "lockedReason",
    "locked_reason",
    "unavailableReason",
    "unavailable_reason",
    "prerequisiteReason",
    "prerequisite_reason",
  ];
  for (const record of records) {
    for (const key of keys) {
      const value = record?.[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return null;
}

/**
 * Client-side learner availability is deliberately fail-closed only for explicit state.
 *
 * Missing flags remain available because many legacy DTOs omit active/enabled/published fields.
 * Explicit false flags or explicit non-public statuses are hidden from learners. Explicit lock
 * flags remain visible but non-actionable so the UI can explain why the item cannot be opened.
 * Server authorization remains authoritative.
 */
export function learnerAvailability(entity) {
  const records = recordsFor(entity);
  if (records.length === 0) {
    return { visible: false, actionable: false, reason: "This item is unavailable." };
  }

  const hidden = records.some((record) =>
    explicitFalse(record?.active)
    || explicitFalse(record?.enabled)
    || explicitFalse(record?.published)
    || explicitFalse(record?.isPublished)
    || explicitFalse(record?.is_published)
    || HIDDEN_STATUSES.has(String(record?.status || "").trim().toUpperCase())
  );

  if (hidden) {
    return {
      visible: false,
      actionable: false,
      reason: "This item is not currently published for learners.",
    };
  }

  const locked = records.some((record) =>
    explicitTrue(record?.locked)
    || explicitTrue(record?.isLocked)
    || explicitTrue(record?.is_locked)
  );

  if (locked) {
    return {
      visible: true,
      actionable: false,
      reason: firstReason(records) || "Complete the required prerequisite to unlock this item.",
    };
  }

  return { visible: true, actionable: true, reason: null };
}

export function learnerChildAvailability(parent, child) {
  const parentState = learnerAvailability(parent);
  if (!parentState.visible || !parentState.actionable) return parentState;
  return learnerAvailability(child);
}

export function isLearnerVisible(entity) {
  return learnerAvailability(entity).visible;
}

export function filterLearnerVisible(items) {
  return (Array.isArray(items) ? items : []).filter(isLearnerVisible);
}
