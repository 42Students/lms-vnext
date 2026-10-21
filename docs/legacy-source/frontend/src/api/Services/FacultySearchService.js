import Api from "../ApiMethod";

// Use v2 API for in-memory search (faster)
const FACULTY_BASE = "/api/v2/faculty";

/**
 * Search faculty with in-memory cache (ultra-fast)
 * Supports synonym expansion and fuzzy matching
 * @param {string} query - Search term
 * @param {number} limit - Maximum number of results (default: 15)
 * @param {number} collegeId - Optional college ID filter
 * @param {number} deptId - Optional department ID filter
 * @param {string} facultyType - Optional faculty type filter
 * @returns {Promise} API response with faculty array
 */
export const searchFaculty = (query = "", limit = 15, collegeId = null, deptId = null, facultyType = null) => {
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  params.append("limit", limit);
  if (collegeId) params.append("collegeId", collegeId);
  if (deptId) params.append("deptId", deptId);
  if (facultyType) params.append("facultyType", facultyType);
  return Api.get(`${FACULTY_BASE}/search?${params.toString()}`);
};

/**
 * Get popular faculty (most frequently accessed)
 * @param {number} limit - Maximum number of results (default: 10)
 * @returns {Promise} API response with faculty array
 */
export const getPopularFaculty = (limit = 10) =>
  Api.get(`${FACULTY_BASE}/popular?limit=${limit}`);

/**
 * Get all colleges
 * @returns {Promise} API response with colleges array
 */
export const getFacultyColleges = () => Api.get(`${FACULTY_BASE}/colleges`);

/**
 * Get faculty by college ID
 * @param {number} collegeId - College ID
 * @param {number} limit - Maximum number of results (default: 50)
 * @returns {Promise} API response with faculty array
 */
export const getFacultyByCollege = (collegeId, limit = 50) =>
  Api.get(`${FACULTY_BASE}/college/${collegeId}?limit=${limit}`);

/**
 * Get faculty by department ID
 * @param {number} deptId - Department ID
 * @param {number} limit - Maximum number of results (default: 50)
 * @returns {Promise} API response with faculty array
 */
export const getFacultyByDepartment = (deptId, limit = 50) =>
  Api.get(`${FACULTY_BASE}/department/${deptId}?limit=${limit}`);

/**
 * Get faculty by faculty type
 * @param {string} facultyType - Faculty type (PROFESSOR, ASSOCIATE_PROFESSOR, etc.)
 * @param {number} limit - Maximum number of results (default: 50)
 * @returns {Promise} API response with faculty array
 */
export const getFacultyByType = (facultyType, limit = 50) =>
  Api.get(`${FACULTY_BASE}/faculty-type/${facultyType}?limit=${limit}`);

/**
 * Get faculty by department (category)
 * @param {string} department - Department name
 * @param {number} limit - Maximum number of results (default: 50)
 * @returns {Promise} API response with faculty array
 */
export const getFacultyByDepartmentCategory = (department, limit = 50) =>
  Api.get(`${FACULTY_BASE}/category/${encodeURIComponent(department)}?limit=${limit}`);

/**
 * Get all departments (categories)
 * @returns {Promise} API response with categories array
 */
export const getFacultyCategories = () => Api.get(`${FACULTY_BASE}/categories`);

/**
 * Record faculty selection for popularity tracking
 * Call this when a user selects/views a faculty member
 * @param {number} facultyId - The ID of the selected faculty
 * @returns {Promise} API response
 */
export const recordFacultySelection = (facultyId) =>
  Api.post(`${FACULTY_BASE}/${facultyId}/select`);

/**
 * Get faculty search statistics
 * @returns {Promise} API response with stats
 */
export const getFacultySearchStats = () =>
  Api.get(`${FACULTY_BASE}/stats`);

/**
 * Check if a faculty exists
 * @param {string} facultyName - Faculty name to check
 * @returns {Promise} API response with boolean
 */
export const facultyExists = (facultyName) =>
  Api.get(`${FACULTY_BASE}/exists/${encodeURIComponent(facultyName)}`);

/**
 * Refresh faculty cache (admin only)
 * @returns {Promise} API response
 */
export const refreshFacultyCache = () =>
  Api.post(`${FACULTY_BASE}/refresh`);

