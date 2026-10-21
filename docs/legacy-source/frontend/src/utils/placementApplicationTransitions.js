// Canonical admin-facing JobApplication state machine.
// WITHDRAWN is intentionally excluded from admin transitions: it is learner-initiated and
// soft-deletes the application. Keep this map aligned with JobApplicationStatusValidator plus
// the backend admin guard that rejects direct WITHDRAWN writes.
export const ADMIN_APPLICATION_TRANSITIONS = Object.freeze({
  APPLIED: Object.freeze(["SHORTLISTED", "REJECTED"]),
  SHORTLISTED: Object.freeze(["ASSESSMENT", "INTERVIEW", "REJECTED", "APPLIED", "WAITLISTED"]),
  ASSESSMENT: Object.freeze(["INTERVIEW", "REJECTED", "WAITLISTED"]),
  INTERVIEW: Object.freeze(["SHORTLISTED", "ASSESSMENT", "OFFERED", "WAITLISTED", "REJECTED"]),
  WAITLISTED: Object.freeze(["OFFERED", "REJECTED"]),
  OFFERED: Object.freeze(["HIRED", "REJECTED", "INTERVIEW"]),
  REJECTED: Object.freeze(["APPLIED"]),
  HIRED: Object.freeze(["OFFERED"]),
});

const normalize = (value) => String(value || "").trim().toUpperCase();

export const getAdminValidApplicationTransitions = (currentStatus) =>
  ADMIN_APPLICATION_TRANSITIONS[normalize(currentStatus)] || [];

export const canAdminTransitionApplication = (currentStatus, targetStatus) => {
  const from = normalize(currentStatus);
  const to = normalize(targetStatus);
  if (!from || !to) return false;
  if (from === to) return true; // backend treats same-status writes as safe no-ops
  return getAdminValidApplicationTransitions(from).includes(to);
};

export const partitionAdminTransitionTargets = (targets, targetStatus) => {
  const valid = [];
  const invalid = [];
  (Array.isArray(targets) ? targets : []).forEach((target) => {
    const normalized = {
      id: typeof target?.id === "string" && /^\d+$/.test(target.id)
        ? Number(target.id)
        : target?.id,
      status: normalize(target?.status),
    };
    if (canAdminTransitionApplication(normalized.status, targetStatus)) valid.push(normalized);
    else invalid.push(normalized);
  });
  return { valid, invalid };
};

/**
 * Keep explicit bulk selections tied to rows that still exist in the latest successful
 * application refresh. Ant Table keys can arrive as numeric strings or numbers; normalize
 * both sides before intersecting so a vanished row cannot remain selected and later be sent
 * as a stale bulk target.
 */
export const reconcileSelectedApplicationIds = (selectedKeys, rows) => {
  const liveIds = new Set(
    (Array.isArray(rows) ? rows : [])
      .map((row) => {
        const raw = row?.id;
        if (typeof raw === "number" && Number.isFinite(raw)) return raw;
        if (typeof raw === "string" && /^\d+$/.test(raw)) return Number(raw);
        return null;
      })
      .filter((id) => id != null)
  );

  return (Array.isArray(selectedKeys) ? selectedKeys : [])
    .map((key) => {
      if (typeof key === "number" && Number.isFinite(key)) return key;
      if (typeof key === "string" && /^\d+$/.test(key)) return Number(key);
      return null;
    })
    .filter((id) => id != null && liveIds.has(id));
};


const BULK_STATUS_CONSEQUENCES = {
  SHORTLISTED: ["Each student is told they were shortlisted."],
  INTERVIEW: ["Each student moves to the interview stage and is told."],
  WAITLISTED: ["Each student is told they are on the waitlist."],
  OFFERED: ["Each student is told they have an offer.", "Offers can be followed up from each application."],
  HIRED: [
    "Each student is marked Hired and told.",
    "Each student's other active applications are withdrawn and their scheduled interviews cancelled automatically.",
    "This cannot be undone in bulk.",
  ],
};

/**
 * PVN-001.24: what a bulk status move will actually do, built from rows already on screen, so the
 * admin reviews real numbers and names before Shortlist / Interview / Waitlist / Offer / Hire go
 * out to students (REJECTED and ASSESSMENT already have their own modals).
 *
 * @param {number[]} ids application ids that will be moved (already validated)
 * @param {string} status target status
 * @param {Map<number, object>|object} rowsById application rows keyed by numeric id
 * @param {string} statusLabel human label for the target status
 */
export const buildBulkStatusPreview = (ids, status, rowsById, statusLabel) => {
  const list = Array.isArray(ids) ? ids : [];
  const lookup = (id) => (rowsById instanceof Map ? rowsById.get(id) : rowsById?.[id]);
  const names = list
    .map((id) => {
      const learner = lookup(id)?.learner;
      const full = learner ? `${learner.firstName || ""} ${learner.lastName || ""}`.trim() : "";
      return full || `Application #${id}`;
    });
  const sample = names.slice(0, 5);
  const more = names.length - sample.length;
  return {
    title: `Move ${list.length} application${list.length === 1 ? "" : "s"} to ${statusLabel || status}?`,
    sample,
    more: more > 0 ? more : 0,
    consequences: BULK_STATUS_CONSEQUENCES[status] || ["Each student is told about the change."],
    danger: status === "HIRED",
  };
};
