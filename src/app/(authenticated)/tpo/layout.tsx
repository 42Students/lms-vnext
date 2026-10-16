import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { canOpenTpoWorkspace, hasTpoTooling } from "@/modules/placements/tpo-workspace-access-model";
import { getTpoPersonalInbox } from "@/modules/activity/tpo-notifications-service";
import {TpoHeaderIndicators} from "@/components/tpo/tpo-header-indicators";
import { countTpoUnreadRecruiterMessages } from "@/modules/placements/tpo-recruiter-unread-count-service";
import { TPO_TOPBAR_QUICK_LINKS } from "@/modules/placements/tpo-topbar-links";
import { TpoFindShortcut } from "@/components/tpo/tpo-find-shortcut";
import {TpoKeyboardShortcuts} from "@/components/tpo/tpo-keyboard-shortcuts";
import {TpoMobileFooter} from "@/components/tpo/tpo-mobile-footer";
import {TpoNewFollowupModal} from "@/components/tpo/tpo-new-followup-modal";
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
   <details className="relative">
     <summary className="min-h-11 cursor-pointer rounded-md border border-border px-3 py-2 text-sm text-primary-text">+ New</summary>
     <nav aria-label="Create placement work" className="absolute right-0 z-20 min-w-44 rounded-md border border-border bg-surface p-2 shadow-lg">
       {TPO_TOPBAR_QUICK_LINKS.map(item => item.label==="Follow-up"?
         <TpoNewFollowupModal key={item.href} collegeId={context.membership!.collegeId}/>:
         <Link key={item.href} href={item.href}
          className="block min-h-10 rounded px-2 py-2 text-sm text-primary-text hover:bg-primary-subtle">{item.label}</Link>)}
     </nav>
   </details>
   <TpoHeaderIndicators initial={{messages:recruiterUnread,unread:inbox.unreadCount,items}}/>
  </div>
  {children}
  <TpoMobileFooter/>
 </div>;
}
