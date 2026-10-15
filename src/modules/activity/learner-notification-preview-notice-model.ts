/** The shared inbox is a bounded preview; never claim the loaded count is
 * a total of all persisted own-member notifications. */
export function learnerNotificationPreviewNotice(loaded:number,limit:number){
 if(!Number.isSafeInteger(limit)||limit<1||!Number.isSafeInteger(loaded)||loaded<0)
  return "Personal notification preview size is unavailable. Older records may appear in history.";
 if(loaded>=limit)
  return "Showing up to "+limit+" recently loaded personal notifications. Older messages may be in your personal notification history.";
 return "Showing "+loaded+" loaded personal notifications. Use your history to browse older records.";
}
