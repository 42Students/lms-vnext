/** Account deletion in the legacy admin screen is not the same operation
 * as deleting one learner profile entry. The vNext membership model keeps a
 * durable audit history and cross-module student/placement ownership. Ending
 * the membership is the available scoped administrative action; permanent
 * erasure and whole-batch CSV undo require a dependency review and a separate
 * privileged workflow. Never label END/INACTIVE as a hard delete.
 */
export const PEOPLE_ADMIN_DESTRUCTIVE_ACTIONS = {
  learner: {
    legacyAction: "Delete student",
    supportedAction: "END_MEMBERSHIP",
    actionLabel: "End college membership",
    explanation: "End this college membership to remove access while preserving academic records, submissions and audit history. This does not erase the person's account.",
    permanentDeleteAvailable: false,
  },
  faculty: {
    legacyAction: "Delete faculty",
    supportedAction: "END_MEMBERSHIP",
    actionLabel: "End faculty membership",
    explanation: "End this faculty membership to remove access while preserving teaching assignments and audit history. This is not a permanent account deletion.",
    permanentDeleteAvailable: false,
  },
  bulkImport: {
    legacyAction: "Undo imported students",
    supportedAction: "REVIEW_PER_MEMBERSHIP",
    actionLabel: "Review imported memberships",
    explanation: "Review each imported membership and its dependencies before ending access. A bulk import cannot be safely reversed after academic or placement activity.",
    permanentDeleteAvailable: false,
  },
  impersonation: {
    legacyAction: "Impersonate user",
    supportedAction: "ADMIN_SCOPE",
    actionLabel: "Select authorized admin scope",
    explanation: "Use the audited organization and college admin scope instead of impersonating another person's session.",
    permanentDeleteAvailable: false,
  },
  otpLockout: {
    legacyAction: "Reset OTP lockout",
    supportedAction: "AUTH_SUPPORT",
    actionLabel: "Contact authentication support",
    explanation: "OTP lockouts are controlled by the authentication service; changing college membership does not reset them.",
    permanentDeleteAvailable: false,
  },
} as const;

export type PeopleAdminDestructiveAction = keyof typeof PEOPLE_ADMIN_DESTRUCTIVE_ACTIONS;
export function peopleAdminActionExplanation(action: PeopleAdminDestructiveAction): string {
  return PEOPLE_ADMIN_DESTRUCTIVE_ACTIONS[action].explanation;
}

/** Stale saved-item IDs cannot start a section overwrite; an existing item
 * requires explicit confirmation before a destructive mutation. */
export function learnerProfileDeletePrompt(section:string,exists:boolean):string|null{
 if(!exists)return null;
 return `Delete this saved ${section} entry? This cannot be undone.`;
}
