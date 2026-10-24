"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { HrRecruiterBell } from "@/components/hr/hr-recruiter-bell";
import { LearnerNotificationBell } from "../learner-notification-bell";
import { shellUnreadBadge } from "../shell-counts-model";
import { TpoNotificationCluster } from "./tpo-notification-cluster";
import {MentorNotificationBellPreview} from "./mentor-notification-bell-preview";
import type { TopbarConfig } from "./portal-config";
import { BellIcon, MessageIcon } from "./icons";
import style from "./topbar.module.css";

function CountBadge({ count }: { count: number | null }) {
  const label = shellUnreadBadge(count);
  return label ? <span className={style["badge"]} aria-hidden="true">{label}</span> : null;
}
function IconLink({
  href, label, count, message = false, countPartial=false,
}: { href: string; label: string; count: number | null; message?: boolean;
  countPartial?:boolean }) {
  return <Link href={href} className={style["iconButton"]+" shrink-0"}
    aria-label={label + (count !== null ? countPartial||count>=40 ?
      ", at least " + count + " unread in loaded sources" :
      ", " + count + " unread" : "")}
    title={label}>
    {message ? <MessageIcon /> : <BellIcon />}
    <CountBadge count={count}/>
  </Link>;
}

/** The existing notification drawers remain authoritative for recruiter and
 * learner accounts. The adapter changes just the icon trigger presentation.
 */
function ExistingBell({ portal }: { portal: "hr" | "learn" }) {
  return <div className={portal === "hr" ? style["bellAdapter"] + " " + style["recruiterBell"] + " shrink-0" : style["bellAdapter"] + " " + style["learnerBell"] + " shrink-0"}>
    {portal === "hr" ? <HrRecruiterBell /> : <LearnerNotificationBell />}
    <span aria-hidden="true" className={style["bellOverlay"]}><BellIcon /></span>
  </div>;
}

export function TopbarNotifications({ config }: { config: TopbarConfig }) {
  const [general, setGeneral] = useState<number | null>(null);
  const [generalPartial,setGeneralPartial]=useState(false);

  const update = useCallback(async () => {
    if (document.visibilityState === "hidden") return;
    if (config.portal === "hr" || config.portal === "learn" || config.portal === "tpo") return;
    try {
      if(config.portal==="mentor"){
        const value=await apiFetch<{
          unreadCount:number;partial:boolean;
        }>("/api/mentor/notifications/count",{
          cache:"no-store",credentials:"same-origin",timeoutMs:12000,
        });
        if(Number.isSafeInteger(value.unreadCount)&&value.unreadCount>=0){
          setGeneral(value.unreadCount);setGeneralPartial(value.partial===true);
        }
        return;
      }
      const next = await apiFetch<unknown>("/api/notifications?limit=40", {
        cache: "no-store", credentials: "same-origin", timeoutMs: 12000,
      });
      if (!next || typeof next !== "object" || !("notifications" in next)) return;
      const records = (next as { notifications: unknown }).notifications;
      if (!Array.isArray(records)) return;
      const valid = records.every(record => record && typeof record === "object" &&
        "notification" in record &&
        (record as { notification: unknown }).notification &&
        typeof (record as { notification: unknown }).notification === "object" &&
        "readAt" in ((record as { notification: Record<string, unknown> }).notification) &&
        (() => {
          const date = (record as {notification:{readAt:unknown}}).notification.readAt;
          return date === null || typeof date === "string";
        })());
      if (!valid) return;
      setGeneral(records.filter(record =>
        (record as {notification:{readAt:unknown}}).notification.readAt === null).length);
    } catch { /* Preserve last successful count. */ }
  }, [config.portal]);

  useEffect(() => {
    if (config.portal === "hr" || config.portal === "learn" || config.portal === "tpo") return;
    void update();
    const timer = window.setInterval(() => void update(), 30000);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
    };
  }, [update]);

  useEffect(()=>{
    if(typeof EventSource==="undefined")return;
    // Cookie-authenticated same-origin SSE: never put a bearer in the URL.
    const connection=new EventSource("/api/notifications/stream");
    const changed=()=>{
      window.dispatchEvent(new Event("lms:notifications-updated"));
      void update();
    };
    connection.addEventListener("notifications",changed);
    return ()=>{
      connection.removeEventListener("notifications",changed);
      connection.close();
    };
  },[update]);

  useEffect(()=>{
    if(config.portal==="hr"||config.portal==="learn"||config.portal==="tpo")return;
    window.addEventListener("lms:notifications-updated",update);
    return ()=>window.removeEventListener("lms:notifications-updated",update);
  },[config.portal,update]);

  if (config.portal === "tpo") return <TpoNotificationCluster/>;
  if (config.portal === "mentor") return <div
    className={style["actions"]+" min-w-0 shrink-0"}
    aria-label="Mentor notifications">
    <MentorNotificationBellPreview unreadCount={general}
      partial={generalPartial}/>
  </div>;
  return <div className={style["actions"] + " min-w-0 shrink-0"} aria-label="Messages and notifications">
    {config.messagesHref ? <IconLink href={config.messagesHref} label="Messages"
      count={null} message /> : null}
    {config.portal === "learn" || config.portal === "hr"
      ? <ExistingBell portal={config.portal}/>
      : <IconLink href={config.notificationsHref} label="Notifications"
          count={general} countPartial={config.portal==="mentor"&&generalPartial}/>}
  </div>;
}
