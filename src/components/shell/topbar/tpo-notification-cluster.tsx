"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { TpoBellPanel } from "@/components/tpo/tpo-bell-panel";
import { tpoHeaderSnapshotSchema, type TpoHeaderSnapshot } from
  "@/modules/activity/tpo-header-snapshot-model";
import { MessageIcon, BellIcon } from "./icons";
import style from "./topbar.module.css";
import { TextLink } from "@/components/ui/text-link";

import { TIMEOUT_MS } from "@/security/limits";
export function TpoNotificationCluster() {
  const [state, setState] = useState<{ value: TpoHeaderSnapshot; revision: number } | null>(null);
  const refreshInFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (document.visibilityState === "hidden" || refreshInFlight.current) return;
    refreshInFlight.current = true;
    try {
      const raw = await apiFetch<unknown>("/api/tpo/header-snapshot", {
        cache: "no-store", credentials: "same-origin", timeoutMs: TIMEOUT_MS.REQUEST,
      });
      const result = tpoHeaderSnapshotSchema.safeParse(raw);
      if (!result.success) return;
      setState(previous => ({
        value: result.data,
        revision: previous ? previous.revision + 1 : 1,
      }));
    } catch {
      // Keep the previous confirmed unread count. Never invent a zero.
    } finally { refreshInFlight.current = false; }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const count = state?.value.messages ?? null;
  return <div role="group" className={style["actions"]+" min-w-0 shrink-0"} aria-label="Messages and notifications">
    <TextLink variant="bare" href="/tpo/messages" className={style["iconButton"]+" shrink-0"}
      aria-label={"Messages" + (count !== null ? ", " + count + " unread" : "")}
      title="Messages">
      <MessageIcon/>
      {count !== null && count > 0 ? <span aria-hidden="true" className={style["badge"]}>
        {count > 99 ? "99+" : count}
      </span> : null}
    </TextLink>
    {state ? <TpoBellPanel compact initialUnread={state.value.unread}
      items={state.value.items} revision={state.revision}/> :
      <TextLink variant="bare" href="/tpo/notifications" className={style["iconButton"]+" shrink-0"}
        aria-label="Notifications — open inbox" title="Open notifications inbox">
        <BellIcon/>
      </TextLink>}
  </div>;
}
