/** Recruiter Messages aliases the authorized conversation inbox (legacy
 * /api/v1/recruiter/messages/threads): newest conversation first, scoped
 * unread totals and distinct general/drive threads. Not a bell inbox.
 */
/** REC-calendar-messages-profile-08: legacy Messages opens recruiter conversations,
 * never placement-system notifications. The notification inventory is preserved at
 * /hr/notifications for the bell and explicit notification links. */
export {default} from "@/app/(authenticated)/hr/conversations/page";
