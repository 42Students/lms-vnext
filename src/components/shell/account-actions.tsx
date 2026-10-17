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

  return (
    <div className="flex flex-wrap items-center justify-end gap-1 text-right">
      {showNotifications ? (
        <Link
          href="/notifications"
          className="inline-flex min-h-9 items-center justify-center rounded-md px-2 text-sm sm:px-3 font-semibold text-foreground transition hover:bg-muted"
        >
          Notifications
        </Link>
      ) : null}
      {copy.accountHref ? (
        <Link
          href={copy.accountHref}
          className="inline-flex min-h-9 items-center justify-center rounded-md px-2 text-sm sm:px-3 font-semibold text-foreground transition hover:bg-muted"
        >
          {copy.accountLabel}
        </Link>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={signOut}
      >
        {copy.signOutLabel}
      </Button>
      {error ? <InlineNotice tone="error" message={error} onDismiss={()=>setError(null)}/> : null}
    </div>
  );
}
