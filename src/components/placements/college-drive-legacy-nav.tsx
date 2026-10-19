"use client";
import { usePathname } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import { collegeDriveDetailTabs, collegeDriveTabActive } from "@/modules/placements/college-drive-legacy-tabs";

export function CollegeDriveLegacyNav({jobId}:{jobId:string}) {
  const pathname = usePathname();
  const tabs = collegeDriveDetailTabs(jobId);
  const active = tabs.find(tab => collegeDriveTabActive(pathname, tab.href))?.href ?? "";
  return <Tabs ariaLabel="Drive sections" renderPanel={false} value={active}
    items={tabs.map(tab => ({ value: tab.href, label: tab.label, href: tab.href }))} />;
}
