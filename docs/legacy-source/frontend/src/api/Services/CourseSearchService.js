import Api from "../ApiMethod";

// Use v2 API for in-memory search (faster)
const COURSES_BASE = "/api/v2/courses";

/**
 * Search courses with in-memory cache (ultra-fast)
 * Supports synonym expansion and fuzzy matching
 * @param {string} query - Search term
 * @param {number} limit - Maximum number of results (default: 15)
 * @param {number} deptId - Optional department ID filter
 * @returns {Promise} API response with courses array
 */
export const searchCourses = (query = "", limit = 15, deptId = null) => {
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  params.append("limit", limit);
  if (deptId) params.append("deptId", deptId);
  return Api.get(`${COURSES_BASE}/search?${params.toString()}`);
};

/**
 * Get popular courses (most frequently accessed)
 * @param {number} limit - Maximum number of results (default: 10)
 * @returns {Promise} API response with courses array
 */
export const getPopularCourses = (limit = 10) =>
  Api.get(`${COURSES_BASE}/popular?limit=${limit}`);

/**
 * Get all departments
 * @returns {Promise} API response with departments array
 */
export const getDepartments = () => Api.get(`${COURSES_BASE}/departments`);

/**
 * Get courses by department ID
 * @param {number} deptId - Department ID
 * @param {number} limit - Maximum number of results (default: 50)
 * @returns {Promise} API response with courses array
 */
export const getCoursesByDepartment = (deptId, limit = 50) =>
  Api.get(`${COURSES_BASE}/department/${deptId}?limit=${limit}`);

/**
 * Get courses by category (department name)
 * @param {string} category - Category/department name
 * @param {number} limit - Maximum number of results (default: 50)
 * @returns {Promise} API response with courses array
 */
export const getCoursesByCategory = (category, limit = 50) =>
  Api.get(`${COURSES_BASE}/category/${encodeURIComponent(category)}?limit=${limit}`);

/**
 * Get all course categories (departments)
 * @returns {Promise} API response with categories array
 */
export const getCourseCategories = () => Api.get(`${COURSES_BASE}/categories`);

/**
 * Record course selection for popularity tracking (by ID)
 * @param {number} courseId - The ID of the selected course
 * @returns {Promise} API response
 */
export const recordCourseSelection = (courseId) =>
  Api.post(`${COURSES_BASE}/${courseId}/select`);

/**
 * Record course selection by slug (preferred - does not expose course ID)
 * @param {string} slug - The course slug (e.g. crs-X9kMn3...)
 * @returns {Promise} API response
 */
export const recordCourseSelectionBySlug = (slug) =>
  Api.post(`${COURSES_BASE}/by-slug/${encodeURIComponent(slug)}/select`);

/**
 * Get course search statistics
 * @returns {Promise} API response with stats
 */
export const getCourseSearchStats = () =>
  Api.get(`${COURSES_BASE}/stats`);

/**
 * Check if a course exists
 * @param {string} courseName - Course name to check
 * @returns {Promise} API response with boolean
 */
export const courseExists = (courseName) =>
  Api.get(`${COURSES_BASE}/exists/${encodeURIComponent(courseName)}`);

/**
 * Refresh course cache (admin only)
 * @returns {Promise} API response
 */
export const refreshCourseCache = () =>
  Api.post(`${COURSES_BASE}/refresh`);

