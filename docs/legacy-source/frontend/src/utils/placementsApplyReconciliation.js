import { classifyApplicationLookup } from "./placementsAppliedLookup";

const DEFINITIVE_REJECTION_STATUSES = new Set([400, 401, 403, 404, 409, 422, 429]);

function applicationError(message, status) {
  const error = new Error(message);
  error.response = { data: { message }, ...(status ? { status } : {}) };
  return error;
}

const UNVERIFIED_MESSAGE =
  "We couldn't verify whether your application was submitted. Check Applications or contact your placement team before trying again.";
const NOT_FOUND_MESSAGE =
  "Your application wasn't found during the follow-up check. Review Applications before trying again.";

/**
 * Serialise writes per learner/job and reconcile responses that could have been
 * lost after the server committed. A failed read never authorises another POST.
 * Server-side duplicate protection remains necessary across devices/tabs.
 */
export function createReconciledApply({ submit, check }) {
  const inFlight = new Set();
  const uncertain = new Set();

  async function reconcile(jobId, learnerId, key) {
    let response;
    try {
      response = await check(jobId, learnerId);
    } catch {
      throw applicationError(UNVERIFIED_MESSAGE);
    }
    const result = classifyApplicationLookup(response);
    if (result === "applied") {
      uncertain.delete(key);
      throw applicationError("An existing application was confirmed. View it in Applications.", 409);
    }
    if (result === "not-applied") {
      uncertain.delete(key);
      throw applicationError(NOT_FOUND_MESSAGE);
    }
    throw applicationError(UNVERIFIED_MESSAGE);
  }

  return async function applyWithReconciliation(jobId, learnerId, resumeUrl) {
    const key = `${learnerId}:${jobId}`;
    if (inFlight.has(key)) {
      throw applicationError("An application request is already in progress. Check its status before trying again.");
    }
    inFlight.add(key);
    try {
      // An earlier POST might have committed despite an unreadable response.
      if (uncertain.has(key)) {
        let previousCheck;
        try {
          previousCheck = await check(jobId, learnerId);
        } catch {
          throw applicationError(UNVERIFIED_MESSAGE);
        }
        const previous = classifyApplicationLookup(previousCheck);
        if (previous === "applied") {
          uncertain.delete(key);
          throw applicationError("An existing application was confirmed. View it in Applications.", 409);
        }
        if (previous !== "not-applied") throw applicationError(UNVERIFIED_MESSAGE);
        uncertain.delete(key);
      }

      let response;
      try {
        response = await submit(jobId, learnerId, resumeUrl);
      } catch (error) {
        if (DEFINITIVE_REJECTION_STATUSES.has(error?.response?.status)) throw error;
        uncertain.add(key);
        await reconcile(jobId, learnerId, key);
        throw applicationError(UNVERIFIED_MESSAGE);
      }
      if (response?.data?.status === "success") {
        uncertain.delete(key);
        return response;
      }
      uncertain.add(key);
      await reconcile(jobId, learnerId, key);
      throw applicationError(UNVERIFIED_MESSAGE);
    } finally {
      inFlight.delete(key);
    }
  };
}
