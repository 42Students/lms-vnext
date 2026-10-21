import { isRecruiterType } from "@/config/roles";
/**
 * Centralized role checking utilities.
 * Provides consistent role checking across the application.
 *
 * Role reference (for AI and developers):
 * - Admin = LMS admin role (FACULTY with facultyType ADMIN); can access /college-admin/* and manage jobs/placement.
 * - Mentor = LMS mentor role (FACULTY with facultyType MENTOR); can access /mentor/projects.
 * - TPO = Training & Placement Officer (FACULTY with facultyType TPO); lives in /tpo only.
 * - recruiter = industry recruiter (userType recruiter, not a faculty or learner); lives in /hr only.
 * Portals, home pages and the strict-portal rules live in src/config/roles.js.
 * - Superadmin (/superadmin) manages LMS data across colleges/orgs.
 */

/**
 * Get user role as a string
 * @param {Object} loginUser - User object from Redux store
 * @returns {string|null} - Role string: "ADMIN", "FACULTY", "LEARNER", or null
 */
export const getUserRole = (loginUser) => {
  if (!loginUser?.userType) return null;
  if (loginUser.userType === "FACULTY") {
    if (loginUser.facultyType === "ADMIN") return "ADMIN";
    if (loginUser.facultyType === "MENTOR") return "MENTOR";
    if (loginUser.facultyType === "TPO") return "TPO";
    return "FACULTY";
  }
  if (loginUser.userType === "LEARNER") return "LEARNER";
  if (isRecruiterType(loginUser.userType)) return "RECRUITER";
  return null;
};

/**
 * Check if user is Faculty (not admin)
 * @param {Object} loginUser - User object from Redux store
 * @returns {boolean}
 */
export const isFacultyRole = (loginUser) =>
  loginUser?.userType === "FACULTY" &&
  loginUser?.facultyType !== "ADMIN" &&
  loginUser?.facultyType !== "TPO";

/**
 * Check if user is a TPO (Training & Placement Officer: FACULTY with facultyType TPO)
 * @param {Object} loginUser - User object from Redux store
 * @returns {boolean}
 */
export const isTpoRole = (loginUser) =>
  loginUser?.userType === "FACULTY" &&
  loginUser?.facultyType === "TPO";

/**
 * Check if user is a recruiter (industry recruiter; its own account type, never faculty or learner)
 * @param {Object} loginUser - User object from Redux store
 * @returns {boolean}
 */
export const isRecruiterRole = (loginUser) => isRecruiterType(loginUser?.userType);

/**
 * Check if user is Mentor
 * @param {Object} loginUser - User object from Redux store
 * @returns {boolean}
 */
export const isMentorRole = (loginUser) =>
  loginUser?.userType === "FACULTY" &&
  loginUser?.facultyType === "MENTOR";

/**
 * Check if user is Admin (Faculty with ADMIN facultyType)
 * @param {Object} loginUser - User object from Redux store
 * @returns {boolean}
 */
export const isAdminRole = (loginUser) => 
  loginUser?.userType === "FACULTY" && 
  loginUser?.facultyType === "ADMIN";

/**
 * Check if user is Learner
 * @param {Object} loginUser - User object from Redux store
 * @returns {boolean}
 */
export const isLearnerRole = (loginUser) => loginUser?.userType === "LEARNER";

/**
 * Check if user should use Faculty profile APIs
 * @param {Object} loginUser - User object from Redux store
 * @returns {boolean}
 */
export const useFacultyProfileApis = (loginUser) => 
  loginUser?.userType === "FACULTY";

/**
 * Get profile page path based on user role
 * @param {Object} loginUser - User object from Redux store
 * @returns {string} - Profile page path
 */
export const getProfilePath = (loginUser) => {
  if (isAdminRole(loginUser)) return "/college-admin/profile";
  if (isRecruiterRole(loginUser)) return "/recruiter/profile";
  if (isTpoRole(loginUser)) return "/tpo/profile";
  if (isMentorRole(loginUser)) return "/mentor/projects";
  if (isFacultyRole(loginUser)) return "/teacher/profile";
  if (isLearnerRole(loginUser)) return "/learn/profile";
  return "/learn/profile"; // Default fallback
};

/**
 * Get notifications page path based on user role
 * @param {Object} loginUser - User object from Redux store
 * @returns {string|null} - Notifications page path, or null for admins, who have no notifications page
 */
export const getNotificationsPath = (loginUser) => {
  if (!loginUser) return "/learn/notifications";
  // Admins neither send nor receive in-app notifications any more, so there is no page to "view all" on.
  if (isAdminRole(loginUser)) return null;
  // recruiter has no notifications page yet; TPO uses the faculty notification feed in its own portal.
  if (isRecruiterRole(loginUser)) return null;
  if (isTpoRole(loginUser)) return "/tpo/notifications";
  // /mentor/notifications is a real page (submissions awaiting review, stalled projects, meetings
  // in the next 48h) and is the third item in the mentor sidebar. This used to return
  // /mentor/projects, so the header's "view all" sent a mentor somewhere different from their own
  // nav. Unlike /mentor/profile and the other mentor stubs — which really are
  // getServerSideProps redirects to /mentor/projects — this route has content to show.
  if (isMentorRole(loginUser)) return "/mentor/notifications";
  if (isFacultyRole(loginUser)) return "/teacher/notifications";
  if (isLearnerRole(loginUser)) return "/learn/notifications";
  return "/learn/notifications";
};
