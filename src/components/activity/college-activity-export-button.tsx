"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Export button honours the current server-authored college audit filters. */
export function CollegeActivityExportButton({href,disabled=false}:{
  href:string;disabled?:boolean;
}) {
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  async function download() {
    if(busy||disabled)return;
    setBusy(true);setNotice("");
    try {
      if(!href.startsWith("/api/activity/college-export"))throw new Error("Invalid audit export");
      const response=await fetch(href,{credentials:"same-origin",cache:"no-store"});
      if(!response.ok)throw new Error("Export unavailable");
      const blob=await response.blob();
      const blobUrl=URL.createObjectURL(blob);
      try {
        const anchor=document.createElement("a");
        anchor.href=blobUrl;
        anchor.download="college-activity.csv";
        document.body.appendChild(anchor);
        anchor.click();anchor.remove();
        setNotice("Activity export ready.");
      }finally{URL.revokeObjectURL(blobUrl);}
    }catch{
      setNotice("Couldn't export activity. Refresh and try again.");
    }finally{
      setBusy(false);
    }
  }
  return <div className="flex flex-wrap items-center gap-2">
    <Button type="button" variant="secondary" disabled={disabled||busy}
      onClick={()=>void download()} className="min-h-11 md:min-h-9">
      {busy?"Exporting…":"↓ Export"}
    </Button>
    {notice?<span role="status" className="text-xs text-muted-foreground">{notice}</span>:null}
  </div>;
}
