"use client";

import Link from "next/link";
import { useEffect,useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {apiFetch} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";
import { accountActionCopy, type AccountMenuVariant } from "./college-account-copy";

export function AccountActions({
  showNotifications = true,
  variant = "other",
}: {
  showNotifications?: boolean;
  variant?: AccountMenuVariant;
}) {
  const router = useRouter();
  const copy = accountActionCopy(variant);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(()=>{
   const sync=(event:StorageEvent)=>{
    if(event.key==="lms:signout"&&event.newValue){router.replace("/");router.refresh();}
   };
   window.addEventListener("storage",sync);
   return ()=>window.removeEventListener("storage",sync);
  },[router]);

  function signOut() {
    setError(null);
    startTransition(async () => {
      try{
        await apiFetch("/api/auth/session",{method:"DELETE"});
        try{window.localStorage.setItem("lms:signout",String(Date.now()));}catch{/* signout must work without storage */}
        router.push("/");
        router.refresh();
      }catch{
        setError("Could not sign out right now. Please try again.");
      }

    });
  }

  // Keep fallback actions together on the legacy control scale; the mounted
  // shell avatar uses the separate TopbarAccountMenu.
  const actionLinkClasses =
    "inline-flex w-full min-w-0 min-h-[var(--lms-control-height)] items-center justify-center " +
    "rounded-[var(--lms-control-radius)] px-[var(--lms-space-3)] text-center text-sm font-semibold " +
    "text-foreground outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 " +
    "focus-visible:outline-[var(--lms-primary)] motion-safe:transition-colors " +
    "motion-safe:duration-[var(--lms-motion-fast)] motion-reduce:transition-none " +
    "max-[767px]:min-h-11 min-[768px]:w-auto";

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col items-stretch gap-[var(--lms-space-3)] min-[768px]:w-auto">
      <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-2)] min-[768px]:flex min-[768px]:flex-wrap min-[768px]:items-center min-[768px]:justify-end">
        {showNotifications ? (
          <Link href="/notifications" className={actionLinkClasses}>
            Notifications
          </Link>
        ) : null}
        {copy.accountHref ? (
          <Link href={copy.accountHref} className={actionLinkClasses}>
            {copy.accountLabel}
          </Link>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          aria-busy={pending}
          className="w-full min-[768px]:w-auto"
          onClick={signOut}
        >
          {copy.signOutLabel}
        </Button>
      </div>
      {error ? (
        <div className="w-full min-w-0 text-left">
          <InlineNotice tone="error" message={error} onDismiss={() => setError(null)} />
        </div>
      ) : null}
    </div>
  );}
