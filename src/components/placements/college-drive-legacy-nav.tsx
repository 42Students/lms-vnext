"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {collegeDriveDetailTabs,collegeDriveTabActive} from "@/modules/placements/college-drive-legacy-tabs";

export function CollegeDriveLegacyNav({jobId}:{jobId:string}){
  const pathname=usePathname();
  return <nav aria-label="Drive sections" className="w-full overflow-x-auto border-b border-border">
    <div className="flex w-max min-w-full gap-2">
      {collegeDriveDetailTabs(jobId).map(tab=><Link key={tab.href}
        href={tab.href} aria-current={collegeDriveTabActive(pathname,tab.href)?"page":undefined}
        className={collegeDriveTabActive(pathname,tab.href)
          ?"rounded-t-md bg-primary-subtle px-4 py-3 text-sm font-semibold text-primary-text"
          :"rounded-t-md px-4 py-3 text-sm font-semibold text-body hover:bg-primary-subtle"}>
        {tab.label}
      </Link>)}
    </div>
  </nav>;
}
