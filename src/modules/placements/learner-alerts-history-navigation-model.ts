/** Personal history has a persisted unread filter, but not a preview-only
 * search. Never misleadingly carry the latter into a global search. */
export function learnerAlertsHistoryHref(unreadOnly:boolean):string{
 return unreadOnly?"/learn/notifications/history?unread=1":"/learn/notifications/history";
}
