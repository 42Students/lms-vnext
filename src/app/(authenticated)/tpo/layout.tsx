import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoPersonalInbox } from "@/modules/activity/tpo-notifications-service";
import { TpoBellPanel } from "@/components/tpo/tpo-bell-panel";
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
   <Link href="/tpo/home" className="min-h-11 inline-flex items-center text-sm text-primary-text underline">Home</Link>
   <Link href="/tpo/find" className="min-h-11 inline-flex items-center text-sm text-primary-text underline">Find a record</Link>
   <TpoBellPanel initialUnread={inbox.unreadCount} items={items}/>
  </div>
  {children}
 </div>;
}
