import { parsePlacementUtcDateTime } from "@/utils/placementDateTime";

/**
 * UI/UX audit, Tier C "Publish Pre-flight" (2026-10-01): publishing a drive today is a single
 * click with an eligibility-count modal and no check at all for the things that actually break a
 * drive once students can see it - no CTC, no deadline, no rounds, no eligibility rules (every
 * student sees it), an off-campus drive with nowhere to actually apply. The blocking items are the
 * ones the server refuses too (TpoDriveService.publishBlockers, 6 Oct 2026), so the two never disagree.
 * Built entirely from data the drive page already has loaded - no new call.
 *
 * `blocking` items must be fixed before Publish is enabled. `warnings` are shown but don't block -
 * a TPO may legitimately publish a pool drive with rounds added later, for example.
 */
export function buildPublishChecklist(job, rounds, now = Date.now()) {
  const options = Array.isArray(job.roleOptionsJson) ? job.roleOptionsJson : [];
  const eligibility = job.eligibilityJson || {};
  const hasEligibilityRule = Object.entries(eligibility).some(([k, v]) => {
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });

  // The same list the server refuses on (TpoDriveService.publishBlockers). A drive recorded after it happened outside needs no
  // deadline or link; an internship may pay a stipend instead of a CTC.
  const outside = Boolean(job.recordedOutside);
  const blocking = [];
  if (!job.jobType) {
    blocking.push({ key: "type", label: "No job type chosen (it decides whether offers count as placed)" });
  }
  if (!options.some((o) => o.ctcLpa != null || o.stipendPerMonth != null)) {
    blocking.push({ key: "ctc", label: "No pay (CTC or stipend) set for any package" });
  }
  if (!outside && !job.applicationDeadline) {
    blocking.push({ key: "deadline", label: "No application deadline set" });
  }
  if (!outside && job.applicationDeadline && parsePlacementUtcDateTime(job.applicationDeadline)?.valueOf() <= now) {
    blocking.push({ key: "deadline-past", label: "The application deadline has passed" });
  }
  if (!outside && job.driveMode === "OFF_CAMPUS" && !job.externalApplyUrl) {
    blocking.push({ key: "link", label: "No company application link set for an off-campus drive" });
  }

  const warnings = [];
  if (rounds.length === 0) {
    warnings.push({ key: "rounds", label: "No interview rounds added yet" });
  }
  if (!hasEligibilityRule) {
    warnings.push({ key: "eligibility", label: "No eligibility rules set - every registered student will see this drive" });
  }

  return { blocking, warnings };
}
