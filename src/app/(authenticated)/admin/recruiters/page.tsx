/**
 * Legacy Super Admin recruiter directory route.
 * Reuse the same server-side scope validation and account management actions
 * as /admin/hr; no second permission path or data service is introduced.
 */
export { default } from "../hr/page";
