/** Explicit TPO/HR placement event-to-channel coverage.
 * The old TpoMailService treated student, recruiter and system mail as one
 * configured transport. VNext must never claim an unprovisioned email was
 * sent: persistence of an in-app event is different from provider acceptance.
 *
 * Every email row is opt-in and additionally subject to provider template,
 * sender domain, recipient allowlist, college ownership and delivery checks
 * in its caller. Empty emailFlag means no external mail integration exists.
 */
export const PLACEMENT_MAIL_EVENT_MATRIX={
 STUDENT_NUDGE:{audience:"LEARNER",inApp:"PERSISTED",emailFlag:"TPO_STUDENT_NUDGE_EMAIL_ENABLED"},
 RECRUITER_MESSAGE_DIGEST:{audience:"RECRUITER",inApp:"PERSISTED_SEPARATELY",emailFlag:"RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED"},
 APPLICATION_STATUS:{audience:"LEARNER",inApp:"EVENT_DEPENDENT",emailFlag:null},
 INTERVIEW_SCHEDULE:{audience:"LEARNER",inApp:"EVENT_DEPENDENT",emailFlag:null},
 OFFER_DECISION:{audience:"LEARNER",inApp:"EVENT_DEPENDENT",emailFlag:null},
 SYSTEM_NOTICE:{audience:"COLLEGE",inApp:"EVENT_DEPENDENT",emailFlag:null},
} as const;

export type PlacementMailEvent=keyof typeof PLACEMENT_MAIL_EVENT_MATRIX;

export function placementEmailChannelEnabled(
 event:PlacementMailEvent,env:Record<string,string|undefined>,
):boolean{
 const flag=PLACEMENT_MAIL_EVENT_MATRIX[event].emailFlag;
 return flag!==null&&env[flag]==="true";
}
