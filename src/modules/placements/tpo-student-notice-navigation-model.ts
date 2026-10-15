/** Separate authoring and personal delivery views; settings cannot imply publication meant delivery. */
export function tpoStudentNoticeNavigation(){
 return {
  notices:"/tpo/announcements",
  inbox:"/tpo/notifications",
  preferences:"/tpo/settings/notifications",
 };
}
