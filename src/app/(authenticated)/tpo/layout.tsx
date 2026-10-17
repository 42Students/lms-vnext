import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { canOpenTpoWorkspace, hasTpoTooling } from "@/modules/placements/tpo-workspace-access-model";
import { getTpoPersonalInbox } from "@/modules/activity/tpo-notifications-service";
import {TpoHeaderIndicators} from "@/components/tpo/tpo-header-indicators";
import { countTpoUnreadRecruiterMessages } from "@/modules/placements/tpo-recruiter-unread-count-service";
import {TpoTopbarNewMenu} from "@/components/tpo/tpo-topbar-new-menu";
import { TpoFindShortcut } from "@/components/tpo/tpo-find-shortcut";
import {TpoKeyboardShortcuts} from "@/components/tpo/tpo-keyboard-shortcuts";
import {TpoMobileFooter} from "@/components/tpo/tpo-mobile-footer";
export default async function TpoLayout({children}:Readonly<{children:React.ReactNode}>){
 const context=await getCurrentRequestContext();
 if (!canOpenTpoWorkspace(context)) redirect("/dashboard");
 if (!hasTpoTooling(context)) return <div className="min-w-0 space-y-4 pb-20 md:pb-0">{children}</div>;
 const inbox=await getTpoPersonalInbox(context,{view:"all"});
 const recruiterUnread=await countTpoUnreadRecruiterMessages(context);
 const items=inbox.page.items.slice(0,20).map(({notification})=>({
  id:notification.id,title:notification.title,body:notification.body,
  actionHref:notification.actionHref,readAt:notification.readAt?.toISOString()??null,
  createdAt:notification.createdAt.toISOString(),
 }));
 return <div className="min-w-0 space-y-4">
  <div className="flex min-w-0 flex-wrap items-center justify-end gap-3" aria-label="TPO quick access">
   <TpoFindShortcut/>
   <TpoKeyboardShortcuts/>
   <TpoTopbarNewMenu collegeId={context.membership!.collegeId}/>

   <TpoHeaderIndicators initial={{messages:recruiterUnread,unread:inbox.unreadCount,items}}/>
  </div>
  {children}
  <TpoMobileFooter/>
 </div>;
}
