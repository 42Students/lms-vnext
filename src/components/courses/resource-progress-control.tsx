"use client";
import { Badge } from "@/components/ui/badge";


import { useEffect,useState, useSyncExternalStore } from "react";
import { useGuardedAction } from "@/hooks/use-guarded-action";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { courseApiError } from "./learner-course-api";
import { useToast } from "@/components/ui/toast";

export function ResourceProgressControl({
  contentId,
  deliveryId,
  contentType = "RESOURCE",
}: {
  contentId: string;
  deliveryId: string;
  contentType?: "RESOURCE" | "LIVE_CLASS";
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { pending: saving, run } = useGuardedAction();
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [resetOpen,setResetOpen]=useState(false);
  const [verified,setVerified]=useState(false);
  const [progressUnavailable,setProgressUnavailable]=useState(false);
  const [reloadKey,setReloadKey]=useState(0);
  const [error, setError] =
    useState<string | null>(null);
  const [complete, setComplete] =useState(false);
  useEffect(()=>{
   const controller=new AbortController();
   const url="/api/courses/progress/"+encodeURIComponent(contentId)+
    "?deliveryId="+encodeURIComponent(deliveryId);
   setVerified(false);setProgressUnavailable(false);
   void fetch(url,{cache:"no-store",signal:controller.signal}).then(async response=>{
    if(!response.ok)throw new Error("PROGRESS_UNAVAILABLE");
    const body=await response.json() as {progress?:{status?:string}};
    if(!body.progress||!["COMPLETED","NOT_STARTED","IN_PROGRESS"].includes(body.progress.status??""))
     throw new Error("PROGRESS_UNAVAILABLE");
    if(controller.signal.aborted)return;
    setComplete(body.progress.status==="COMPLETED");
    setVerified(true);setProgressUnavailable(false);
   }).catch(()=>{
    if(!controller.signal.aborted){setProgressUnavailable(true);setVerified(false);}
   });
   return ()=>controller.abort();
  },[contentId,deliveryId,reloadKey]);


  async function markComplete(next=true) {
    if (saving || !verified || complete===next) return;
    setError(null);
    try {
      await run(async () => {
      const response = await fetch(
        `/api/courses/progress/${contentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deliveryId,
            completed: next,
          }),
        },
      );

      if (!response.ok) {
        const explanation = await courseApiError(response);
        const friendly = explanation || "Could not mark this as complete. Please try again.";
        setError(friendly);
        showToast({ tone: "error", title: "Could not mark this as complete. Please try again.",
          description: friendly });
        return;
      }

      setComplete(next);
      showToast({tone:"success",title:next?"Marked as complete":"Ready to rewatch"});
      setConfirmOpen(false);setResetOpen(false);
      router.refresh();
      });
    } catch {
      const fallback = "Could not mark this as complete. Please try again.";
      setError(fallback);
      showToast({tone:"error",title:fallback});
    }
  }

  return (
    <div className="min-w-0 space-y-2 border-t border-border pt-3">
      <p className="text-xs text-body">
        {contentType==="LIVE_CLASS"?"Attended this session?":"Finished with these materials?"}
        {" "}Only mark complete when you have reviewed the lesson.
      </p>
      {!verified?<div role="status" className="text-xs text-warning-text">
        {progressUnavailable?"Progress unavailable — retry to check the lesson state before changing completion.":"Checking saved progress…"}
        {progressUnavailable?<Button type="button" variant="secondary" size="sm"
          onClick={()=>setReloadKey(key=>key+1)}>Retry progress</Button>:null}
      </div>:null}
      {complete ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge role="status" tone="success" className="inline-flex min-h-11 items-center px-3 md:min-h-9">Marked as complete</Badge>
          {contentType==="RESOURCE"?<Button variant="secondary" size="sm" disabled={!verified||saving}
            onClick={()=>setResetOpen(true)} className="min-h-11 md:min-h-9">Mark incomplete to rewatch</Button>:null}
        </div>
      ) : (
        <Button size="sm" className="min-h-11 w-full sm:w-auto md:min-h-9"
          variant="primary" disabled={!hydrated||saving||!verified}
          loading={saving} onClick={()=>{setError(null);setConfirmOpen(true);}}>
          {saving?"Saving…":"Mark as complete"}
        </Button>
      )}
      <ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!saving)setConfirmOpen(next);}}
        title={contentType === "LIVE_CLASS" ? "Attended this session?" : "Finished with these materials?"}
        description="Mark this learning item as complete?"
        confirmLabel="Mark as complete" confirmVariant="primary" pending={saving} onConfirm={()=>void markComplete(true)}>
        {error?<Alert tone="error">{error}</Alert>:null}
      </ConfirmDialog>
      <ConfirmDialog open={resetOpen} onOpenChange={next=>{if(!saving)setResetOpen(next);}}
        title="Rewatch this lesson?" description="Clear the latest completed mark while preserving the first completion date in your learning history."
        confirmLabel="Mark incomplete" confirmVariant="primary" pending={saving}
        onConfirm={()=>void markComplete(false)}/>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </div>
  );
}
