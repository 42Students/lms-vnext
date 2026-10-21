// Profile verification (Education + Identity). Backend: ProfileVerificationController
// (docs/tpo-ux/PROFILE-VERIFICATION-DESIGN.md). A super admin passes collegeId; everyone else works on their own college.
import Api from "../ApiMethod";

const V = "/api/v1/profile-verification";
const withCollege = (collegeId, extra = {}) => ({ params: { ...(collegeId ? { collegeId } : {}), ...extra } });

// Student
export const getMyVerification = () => Api.get("/api/v1/profile/verification");
export const submitVerification = (section) => Api.post(`/api/v1/profile/verification/${section}/submit`);

// Verifiers
export const getVerificationAccess = (collegeId) => Api.get(`${V}/access`, withCollege(collegeId));
export const getVerificationQueue = (collegeId, { status, section } = {}) =>
  Api.get(`${V}/queue`, withCollege(collegeId, { ...(status ? { status } : {}), ...(section ? { section } : {}) }));
export const getVerificationStudent = (collegeId, learnerId) => Api.get(`${V}/students/${learnerId}`, withCollege(collegeId));
// seenSubmittedAt: when the submission on screen was sent; the server refuses if the student sent a newer one since.
export const verifySection = (collegeId, learnerId, section, seenSubmittedAt) =>
  Api.post(`${V}/students/${learnerId}/${section}/verify`, null, withCollege(collegeId, seenSubmittedAt ? { seenSubmittedAt } : {}));
export const sendBackSection = (collegeId, learnerId, section, reason) => Api.post(`${V}/students/${learnerId}/${section}/send-back`, { reason }, withCollege(collegeId));
export const verifyMany = (collegeId, items) => Api.post(`${V}/verify-many`, { items }, withCollege(collegeId));
export const getVerificationSettings = (collegeId) => Api.get(`${V}/settings`, withCollege(collegeId));
export const saveVerificationSettings = (collegeId, tpoCanVerify) => Api.put(`${V}/settings`, { tpoCanVerify }, withCollege(collegeId));

/** Opens a student's document through the access-checked download route (not the raw link). */
export const getDocumentUrl = (url, learnerId) => Api.get("/api/v1/upload/file/download", { params: { fileName: url, userId: learnerId } });
