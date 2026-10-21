/** Safe user-facing message for known form errors; unknown query values are ignored. */
const MESSAGES:Record<string,string>={
 INVALID_BODY:"Check the announcement title, message, audience and dates before saving.",
 BUTTON_URL_INVALID:"The link has to start with https://",
 TITLE_REQUIRED:"Give it a title",
 MESSAGE_REQUIRED:"Write the announcement",
 SAVE_FAILED:"Couldn't save",
 INVALID_VERSION:"Reload the announcement and try again.",
 INVALID_TIME:"Pick valid future dates (IST).",
 FORBIDDEN:"You do not have permission to change this announcement.",
 NOT_FOUND:"This announcement is no longer available. Reload the page.",
 STALE_VERSION:"This announcement changed since you opened it. Reload and try again.",
 UNDO_WINDOW_EXPIRED:"The 30-second Undo window has ended.",
 ANNOUNCEMENTS_NOT_REGISTERED:"Announcements are temporarily unavailable until their storage is ready.",
 TARGETED_NOTICES_NOT_REGISTERED:"Targeted announcements are not ready. Choose the whole college instead.",
 TPO_NOTICE_NO_RECIPIENTS:"Nobody currently matches this audience. Choose another audience.",
 NO_RECIPIENTS:"Nobody currently matches this audience. Choose another audience.",
 AUDIENCE_LOCKED:"Only future scheduled announcements can change their audience before delivery. Your other edits were not saved.",

};
export function tpoNoticeFormErrorMessage(value:string|undefined|null):string|null{
 return value&&Object.prototype.hasOwnProperty.call(MESSAGES,value)?MESSAGES[value]:null;
}
