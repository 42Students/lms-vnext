import Api from "../ApiMethod";

// Use v2 API for in-memory search (faster)
const SKILLS_BASE = "/api/v2/skills";

// Legacy v1 API (database-based)
const SKILLS_V1_BASE = "/api/v1/skills";

/**
 * Search skills with in-memory cache (ultra-fast)
 * Supports synonym expansion and fuzzy matching
 * @param {string} query - Search term
 * @param {number} limit - Maximum number of results (default: 15)
 * @returns {Promise} API response with skills array
 */
export const searchSkills = (query = "", limit = 15) => {
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  params.append("limit", limit);
  return Api.get(`${SKILLS_BASE}/search?${params.toString()}`);
};

/**
 * Get popular skills (most frequently selected)
 * @param {number} limit - Maximum number of results (default: 10)
 * @returns {Promise} API response with skills array
 */
export const getPopularSkills = (limit = 10) =>
  Api.get(`${SKILLS_BASE}/popular?limit=${limit}`);

/**
 * Get all skill categories
 * @returns {Promise} API response with categories array
 */
export const getSkillCategories = () => Api.get(`${SKILLS_BASE}/categories`);

/**
 * Get skills by category
 * @param {string} category - Category name
 * @param {number} limit - Maximum number of results (default: 50)
 * @returns {Promise} API response with skills array
 */
export const getSkillsByCategory = (category, limit = 50) =>
  Api.get(`${SKILLS_BASE}/category/${encodeURIComponent(category)}?limit=${limit}`);

/**
 * Record skill selection for popularity tracking
 * Call this when a user selects a skill (uses skill name, not ID)
 * @param {string} skillName - The name of the selected skill
 * @returns {Promise} API response
 */
export const recordSkillSelection = (skillName) =>
  Api.post(`${SKILLS_BASE}/${encodeURIComponent(skillName)}/select`);

/**
 * Get skills cache statistics
 * @returns {Promise} API response with stats
 */
export const getSkillsStats = () =>
  Api.get(`${SKILLS_BASE}/stats`);

/**
 * Check if a skill exists
 * @param {string} skillName - Skill name to check
 * @returns {Promise} API response with boolean
 */
export const skillExists = (skillName) =>
  Api.get(`${SKILLS_BASE}/exists/${encodeURIComponent(skillName)}`);

// ==================== LEGACY V1 API ====================

/**
 * Legacy search (database-based)
 * @deprecated Use searchSkills() instead
 */
export const searchSkillsV1 = (query = "", limit = 15) => {
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  params.append("limit", limit);
  return Api.get(`${SKILLS_V1_BASE}/search?${params.toString()}`);
};

/**
 * Evict search caches (admin only)
 * @returns {Promise} API response
 */
export const evictSkillCaches = () =>
  Api.post(`${SKILLS_V1_BASE}/cache/evict`);


