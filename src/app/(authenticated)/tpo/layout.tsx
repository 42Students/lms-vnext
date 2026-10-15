import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoPersonalInbox } from "@/modules/activity/tpo-notifications-service";
import { TpoBellPanel } from "@/components/tpo/tpo-bell-panel";
import { TPO_TOPBAR_QUICK_LINKS } from "@/modules/placements/tpo-topbar-links";
export default async function TpoLayout({children}:Readonly<{children:React.ReactNode}>){
 const context=await getCurrentRequestContext();
 if (
  !hasMembershipRole(
      context,
      "TPO",
  )
 )redirect("/dashboard");
 const inbox=await getTpoPersonalInbox(context,{view:"all"});
 const items=inbox.page.items.slice(0,10).map(({notification})=>({
  id:notification.id,title:notification.title,body:notification.body,
  actionHref:notification.actionHref,readAt:notification.readAt?.toISOString()??null,
 }));
 return <div className="min-w-0 space-y-4">
  <div className="flex min-w-0 flex-wrap items-center justify-end gap-3" aria-label="TPO quick access">
   <Link href="/tpo/find" className="min-h-11 inline-flex items-center text-sm text-primary-text underline">Find a student, recruiter or company</Link>
   <details className="relative">
     <summary className="min-h-11 cursor-pointer rounded-md border border-border px-3 py-2 text-sm text-primary-text">+ New</summary>
     <nav aria-label="Create placement work" className="absolute right-0 z-20 min-w-44 rounded-md border border-border bg-surface p-2 shadow-lg">
       {TPO_TOPBAR_QUICK_LINKS.map(item => <Link key={item.href} href={item.href}
         className="block min-h-10 rounded px-2 py-2 text-sm text-primary-text hover:bg-primary-subtle">{item.label}</Link>)}
     </nav>
   </details>
   <Link href="/tpo/messages" className="min-h-11 inline-flex items-center text-sm text-primary-text underline">Messages</Link>
   <TpoBellPanel initialUnread={inbox.unreadCount} items={items}/>
  </div>
  {children}
 </div>;
}
