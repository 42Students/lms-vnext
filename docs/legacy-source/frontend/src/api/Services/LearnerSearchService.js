import Api from "../ApiMethod";

// Use v2 API for in-memory search (faster)
const LEARNERS_BASE = "/api/v2/learners";

/**
 * Search learners with in-memory cache (ultra-fast)
 * Supports synonym expansion and fuzzy matching
 * @param {string} query - Search term
 * @param {number} limit - Maximum number of results (default: 15)
 * @param {number} collegeId - Optional college ID filter
 * @param {number} programId - Optional program ID filter
 * @param {number} classId - Optional class ID filter
 * @returns {Promise} API response with learners array
 */
export const searchLearners = (query = "", limit = 15, collegeId = null, programId = null, classId = null) => {
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  params.append("limit", limit);
  if (collegeId) params.append("collegeId", collegeId);
  if (programId) params.append("programId", programId);
  if (classId) params.append("classId", classId);
  return Api.get(`${LEARNERS_BASE}/search?${params.toString()}`);
};

/**
 * Get popular learners (most frequently accessed)
 * @param {number} limit - Maximum number of results (default: 10)
 * @param {number} collegeId - Optional college ID filter
 * @returns {Promise} API response with learners array
 */
export const getPopularLearners = (limit = 10, collegeId = null) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (collegeId != null) params.set("collegeId", String(collegeId));
  return Api.get(`${LEARNERS_BASE}/popular?${params.toString()}`);
};

/**
 * Get all colleges
 * @returns {Promise} API response with colleges array
 */
export const getColleges = () => Api.get(`${LEARNERS_BASE}/colleges`);

/**
 * Get learners by college ID
 * @param {number} collegeId - College ID
 * @param {number} limit - Maximum number of results (default: 50)
 * @returns {Promise} API response with learners array
 */
export const getLearnersByCollege = (collegeId, limit = 50) =>
  Api.get(`${LEARNERS_BASE}/college/${collegeId}?limit=${limit}`);

/**
 * Get learners by program ID
 * @param {number} programId - Program ID
 * @param {number} limit - Maximum number of results (default: 50)
 * @returns {Promise} API response with learners array
 */
export const getLearnersByProgram = (programId, limit = 50) =>
  Api.get(`${LEARNERS_BASE}/program/${programId}?limit=${limit}`);

/**
 * Get learners by class ID
 * @param {number} classId - Class ID
 * @param {number} limit - Maximum number of results (default: 50)
 * @returns {Promise} API response with learners array
 */
export const getLearnersByClass = (classId, limit = 50) =>
  Api.get(`${LEARNERS_BASE}/class/${classId}?limit=${limit}`);

/**
 * Get learners by department (category)
 * @param {string} department - Department name
 * @param {number} limit - Maximum number of results (default: 50)
 * @returns {Promise} API response with learners array
 */
export const getLearnersByDepartment = (department, limit = 50) =>
  Api.get(`${LEARNERS_BASE}/category/${encodeURIComponent(department)}?limit=${limit}`);

/**
 * Get all departments (categories)
 * @returns {Promise} API response with categories array
 */
export const getLearnerCategories = () => Api.get(`${LEARNERS_BASE}/categories`);

/**
 * Record learner selection for popularity tracking
 * Call this when a user selects/views a learner
 * @param {number} learnerId - The ID of the selected learner
 * @returns {Promise} API response
 */
export const recordLearnerSelection = (learnerId) =>
  Api.post(`${LEARNERS_BASE}/${learnerId}/select`);

/**
 * Get learner search statistics
 * @returns {Promise} API response with stats
 */
export const getLearnerSearchStats = () =>
  Api.get(`${LEARNERS_BASE}/stats`);

/**
 * Check if a learner exists
 * @param {string} learnerName - Learner name to check
 * @returns {Promise} API response with boolean
 */
export const learnerExists = (learnerName) =>
  Api.get(`${LEARNERS_BASE}/exists/${encodeURIComponent(learnerName)}`);

/**
 * Refresh learner cache (admin only)
 * @returns {Promise} API response
 */
export const refreshLearnerCache = () =>
  Api.post(`${LEARNERS_BASE}/refresh`);

