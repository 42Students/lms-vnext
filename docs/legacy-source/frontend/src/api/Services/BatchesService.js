import Api from "../ApiMethod";

// Batches and eligibility (docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md). Backend: controller/tpo/TpoBatchesController.
const W = "/api/v1/tpo";

export const getBatches = () => Api.get(`${W}/batches`);
export const getBatch = (batchId) => Api.get(`${W}/batches/${batchId}`);
export const getBatchStudents = (batchId) => Api.get(`${W}/batches/${batchId}/students`);
/** body: { registrationDeadline, setDeadline, finished } */
export const updateBatch = (batchId, body) => Api.put(`${W}/batches/${batchId}`, body);
/** changes: [{ scopeType: BATCH|CLASS|LEARNER, scopeId, status: ELIGIBLE|INELIGIBLE|null, reason, note }] */
export const decideEligibility = (changes) => Api.post(`${W}/eligibility`, { changes });
export const getLastEligibilityAction = () => Api.get(`${W}/eligibility/last-action`);
export const undoEligibility = (actionId) => Api.post(`${W}/eligibility/undo`, { actionId });
/** rows: [{ roll, decision, reason }] */
export const previewEligibilityImport = (rows) => Api.post(`${W}/eligibility/import/preview`, { rows });
export const commitEligibilityImport = (rows) => Api.post(`${W}/eligibility/import`, { rows });
/** Invite the batch's eligible students to register by the deadline (also moves the deadline). */
export const inviteBatch = (batchId, deadline) => Api.post(`${W}/batches/${batchId}/invite`, { deadline });
/** Remind eligible students of the batch who have not chosen yet. */
export const remindBatch = (batchId) => Api.post(`${W}/batches/${batchId}/remind`);
/** { college, batch (its own changes), effective, jobTypes } */
export const getBatchRules = (batchId) => Api.get(`${W}/batches/${batchId}/rules`);
/** body: the batch's own values for countsAsPlacedAt, maxHeldOffers, upliftPct, minResponseHours; {} = follow the college. */
export const saveBatchRules = (batchId, body) => Api.put(`${W}/batches/${batchId}/rules`, body);
