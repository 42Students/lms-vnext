import {redirect} from "next/navigation";
/** TPO-inbox-team-14: one canonical notification history, not an inconsistent
 * second read-state UI under Messages. */
export default function TpoOwnNotificationsPage(){
 redirect("/tpo/notifications");
}
