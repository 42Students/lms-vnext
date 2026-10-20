"use client";
import {useRouter} from "next/navigation";
import {useTransition} from "react";
import {Button} from "@/components/ui/button";
export function LearnerProfileAcademicRetry(){
  const router=useRouter();const [pending,startTransition]=useTransition();
  return <Button className="mt-3 min-h-11 min-[768px]:min-h-9" variant="secondary" disabled={pending}
    onClick={()=>startTransition(()=>router.refresh())}>{pending?"Reloading…":"Retry academic summary"}</Button>;
}
