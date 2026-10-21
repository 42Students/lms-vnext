import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { NotificationList, type NotificationListItem } from "@/components/activity/notification-list";
import { NotificationToolbar } from "@/components/activity/notification-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { listVisibleAnnouncementsForMembership } from "@/modules/announcements/service";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
 countOwnUnreadNotifications, listOwnNotificationPage,
 countOwnUnreadNotificationCategory, ownNotificationCategoryChoices,
 type OwnNotificationCategory,
} from "@/modules/activity/notification-service";
import { parseNotificationCursor } from "@/modules/activity/notification-cursor";

type Params={
 view?:string;category?:string;beforeCreatedAt?:string;beforeId?:string;
 q?:string;classId?:string;courseId?:string;
};
const inbox="/notifications";
const isUuid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export default async function NotificationsPage({searchParams}:{searchParams:Promise<Params>}) {
 const params=await searchParams;
 const view=params.view==="unread"?"unread":"all";
 const context=await getCurrentRequestContext();
 const categoryChoices=ownNotificationCategoryChoices(context);
 const category=categoryChoices.some(item=>item.id===params.category)
  ?params.category as OwnNotificationCategory:undefined;
 const invalidCategory=Boolean(params.category&&!category);
 const query=(params.q??"").trim();
 const invalidQuery=query.length>100;
 // A legacy classId or courseId must resolve within the authenticated
 // current membership; never turn an untrusted numeric ID into a global scope.
 const invalidScope=Boolean(
  (params.classId&&!isUuid(params.classId))||
  (params.courseId&&!isUuid(params.courseId))
 );
 const parsedCursor=parseNotificationCursor({
  beforeCreatedAt:params.beforeCreatedAt,beforeId:params.beforeId,
 });
 const invalid=parsedCursor.invalid||invalidCategory||invalidQuery||invalidScope;
 const newest=!params.beforeCreatedAt&&!params.beforeId;
 const categoriesPromise=Promise.all(categoryChoices.map(async choice=>({
  id:choice.id,label:choice.label,
  unread:await countOwnUnreadNotificationCategory(context,choice.id),
 })));
 const [notificationResult,unreadResult,announcementResult,categoriesResult]=await Promise.allSettled([
  invalid?Promise.resolve({items:[],nextCursor:null}):
   listOwnNotificationPage(context,{
    limit:50,unreadOnly:view==="unread",
    ...(category?{category}:{}),
    ...(params.classId?{classId:params.classId}:{}),
    ...(params.courseId?{courseId:params.courseId}:{}),
    ...(query?{query}:{}),
    ...(parsedCursor.cursor??{}),
   }),
  countOwnUnreadNotifications(context),
  !invalid&&view==="all"&&newest&&announcementsRuntimeEnabled()&&
   (!category||category==="ANNOUNCEMENTS")&&!params.classId&&!params.courseId
    ?listVisibleAnnouncementsForMembership(context,new Date(),{limit:75})
    :Promise.resolve([]),
  categoriesPromise,
 ]);
 for(const result of [notificationResult,unreadResult,announcementResult,categoriesResult]){
  if(result.status==="rejected"&&result.reason instanceof AuthorizationError)throw result.reason;
 }
 const failedNotifications=notificationResult.status==="rejected";
 const page=notificationResult.status==="fulfilled"
  ?notificationResult.value:{items:[],nextCursor:null};
 const unreadCount=unreadResult.status==="fulfilled"?unreadResult.value:0;
 const announcements=announcementResult.status==="fulfilled"?announcementResult.value:[];
 const categoryCounts=categoriesResult.status==="fulfilled"?categoriesResult.value:[];
 const partialFailure=failedNotifications||unreadResult.status==="rejected"||
  announcementResult.status==="rejected"||categoriesResult.status==="rejected";
 const baseParams=new URLSearchParams({view});
 if(query)baseParams.set("q",query);
 if(category)baseParams.set("category",category);
 if(params.classId)baseParams.set("classId",params.classId);
 if(params.courseId)baseParams.set("courseId",params.courseId);
 const retryHref=inbox+"?"+baseParams.toString();
 const nextHref=page.nextCursor?inbox+"?"+new URLSearchParams({
  ...Object.fromEntries(baseParams),
  beforeCreatedAt:page.nextCursor.beforeCreatedAt.toISOString(),
  beforeId:page.nextCursor.beforeId,
 }).toString():null;
 const items:NotificationListItem[]=[
  ...page.items.map(({notification,event})=>({
   id:notification.id,title:notification.title?.trim()||"Notification",
   body:notification.body,actionHref:notification.actionHref,
   readAt:notification.readAt?.toISOString()??null,
   createdAt:notification.createdAt.toISOString(),
   module:event.module,importance:event.importance,
   contextLine:event.module?.replaceAll("_"," ")||"Course update",
  })),
  ...announcements.filter(item=>!query||
    item.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())||
    item.message.toLocaleLowerCase().includes(query.toLocaleLowerCase())).map(item=>({
    id:"announcement:"+item.id,title:item.title,body:item.message,
    actionHref:null,readAt:null,createdAt:item.createdAt.toISOString(),
    module:"ANNOUNCEMENTS",importance:item.isPinned?"HIGH":"NORMAL",
    source:"ANNOUNCEMENT" as const,pinned:item.isPinned,
    contextLine:item.receiverType.replaceAll("_"," ")+" announcement",
  })),
 ].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id));
 const emptyText=view==="unread"?"No unread notifications yet":
  category?"No "+(categoryChoices.find(item=>item.id===category)?.label??"")+" notifications yet":
  "No notifications yet";
 return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  <PageHeader title="Notifications"
   description="Course updates, announcements and activity for your selected workspace."/>
  <NotificationToolbar view={view} unreadCount={unreadCount}
   categories={categoryCounts} selectedCategory={category}/>
  <form action={inbox} method="get" role="search"
   className="flex min-w-0 flex-wrap items-end gap-2">
   <input type="hidden" name="view" value={view}/>
   {category?<input type="hidden" name="category" value={category}/>:null}
   {params.classId?<input type="hidden" name="classId" value={params.classId}/>:null}
   {params.courseId?<input type="hidden" name="courseId" value={params.courseId}/>:null}
   <label className="min-w-0 flex-1 text-sm font-semibold text-body">Search notifications
    <Input type="search" name="q" maxLength={100} defaultValue={query}
     placeholder="Search title or message" className="mt-1 w-full"/>
   </label>
   <Button type="submit">Search</Button>
   {query?<Link href={inbox+"?view="+view} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">Clear</Link>:null}
  </form>
  {invalid?<Alert tone="error">
   The notification filters or page link are invalid.{" "}
   <Link href={inbox+"?view="+view} className="font-semibold text-primary-text underline">
    Return to the newest notifications
   </Link>
  </Alert>:null}
  {partialFailure?<Alert tone={failedNotifications?"error":"warning"}>
   <strong>{failedNotifications?"Couldn't load notifications":"Couldn't refresh notifications"}</strong>
   {" "}The available notification sources remain visible.{" "}
   <Link href={retryHref} className="font-semibold text-primary-text underline">Retry</Link>
  </Alert>:null}
  {!invalid&&(!failedNotifications||items.length>0)?<>
   <NotificationList items={items} emptyText={emptyText}
    emptyAction={items.length===0&&category?<Link href={inbox+"?view=all"}
      className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">All</Link>
     :view==="unread"?<Link href={inbox+"?view=all"} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">All</Link>:null}/>
   {nextHref?<div className="flex justify-center"><Link href={nextHref}
    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
    Older notifications
   </Link></div>:null}
  </>:null}
 </div>;
}
