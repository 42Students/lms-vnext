/** A recruiter notification acknowledgement is not authorization to retry indefinitely. */
export function hrNotificationReadError(status:number):string{
 if(status===401)return "Your session has ended. Sign in again to manage notifications.";
 if(status===403)return "You no longer have access to this notification. Refresh the inbox.";
 if(status===404)return "This notification is no longer available. Refresh the inbox.";
 if(status===409)return "This notification changed. Refresh the inbox.";
 if(status===429)return "Too many requests. Try again shortly.";
 return "Unable to mark as read. Check your connection and try again.";
}
