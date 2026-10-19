"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { HrRecruiterBell } from "@/components/hr/hr-recruiter-bell";
import { LearnerNotificationBell } from "../learner-notification-bell";
import { shellUnreadBadge } from "../shell-counts-model";
import { TpoNotificationCluster } from "./tpo-notification-cluster";
import type { TopbarConfig } from "./portal-config";
import { BellIcon, MessageIcon } from "./icons";
import style from "./topbar.module.css";

function CountBadge({ count }: { count: number | null }) {
  const label = shellUnreadBadge(count);
  return label ? <span className={style.badge} aria-hidden="true">{label}</span> : null;
}
function IconLink({
  href, label, count, message = false,
}: { href: string; label: string; count: number | null; message?: boolean }) {
  return <Link href={href} className={style.iconButton}
    aria-label={label + (count !== null ? ", " + count + " unread" : "")}
    title={label}>
    {message ? <MessageIcon /> : <BellIcon />}
    <CountBadge count={count}/>
  </Link>;
}

/** The existing notification drawers remain authoritative for recruiter and
 * learner accounts. The adapter changes just the icon trigger presentation.
 */
function ExistingBell({ portal }: { portal: "hr" | "learn" }) {
  return <div className={portal === "hr" ? style.bellAdapter + " " + style.recruiterBell : style.bellAdapter + " " + style.learnerBell}>
    {portal === "hr" ? <HrRecruiterBell /> : <LearnerNotificationBell />}
    <span aria-hidden="true" className={style.bellOverlay}><BellIcon /></span>
  </div>;
}

export function TopbarNotifications({ config }: { config: TopbarConfig }) {
  const [general, setGeneral] = useState<number | null>(null);

  const update = useCallback(async () => {
    if (document.visibilityState === "hidden") return;
    if (config.portal === "hr" || config.portal === "learn" || config.portal === "tpo") return;
    try {
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
        "readAt" in ((record as { notification: Record<string, unknown> }).notification));
      if (!valid) return;
      setGeneral(records.filter(record =>
        (record as {notification:{readAt:unknown}}).notification.readAt === null).length);
    } catch { /* Preserve last successful count. */ }
  }, [config.portal]);

  useEffect(() => {
    void update();
    const timer = window.setInterval(() => void update(), 30000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, [update]);

  if (config.portal === "tpo") return <TpoNotificationCluster/>;
  return <div className={style.actions} aria-label="Messages and notifications">
    {config.messagesHref ? <IconLink href={config.messagesHref} label="Messages"
      count={null} message /> : null}
    {config.portal === "learn" || config.portal === "hr"
      ? <ExistingBell portal={config.portal}/>
      : <IconLink href={config.notificationsHref} label="Notifications"
          count={general} />}
  </div>;
}
