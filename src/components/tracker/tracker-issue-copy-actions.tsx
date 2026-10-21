"use client";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useState} from "react";

type FullIssue={
  publicId:string;status:string;severity:string;environment:string;
  reporterName:string;accountRole:string;createdAt:Date|string;
  page:string;screen:string|null;section:string|null;issueType:string;
  description:string;sourceUrl:string|null;sourcePath:string|null;
  browser:string|null;viewport:string|null;evidenceLink:string|null;
  resolution:string|null;affectedLayer:string|null;
  rootCause:string|null;fixNotes:string|null;
  frontendCommitSha:string|null;backendCommitSha:string|null;
  regressionTestStatus:string;retestStatus:string;productionVerified:boolean;
};
type Props={publicId:string;description:string;page:string;issue?:FullIssue;attachmentCount?:number};
const trim=(text:string|null|undefined)=>text?.trim()||"";
const label=(text:string|null|undefined)=>trim(text).replaceAll("_"," ").toLowerCase();
function issueMarkdown(issue:FullIssue,url:string,attachmentCount:number){
  const location=[issue.page,issue.screen,issue.section].filter(Boolean).join(" · ");
  const date=new Date(issue.createdAt);
  const when=Number.isNaN(date.getTime())?"":new Intl.DateTimeFormat("en-IN",{
    timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
  }).format(date);
  const lines=[
    "## "+issue.publicId+(location?" — "+location:""),"",
    "**Status:** "+label(issue.status)+" · **Severity:** "+label(issue.severity)+
      " · **Environment:** "+label(issue.environment),
    "**Reported by:** "+(trim(issue.reporterName)||"Unknown")+
      (issue.accountRole?" ("+label(issue.accountRole)+")":"")+(when?" · "+when:""),
    "**Link:** "+url,"","### What went wrong",trim(issue.description)||"_No description._",
  ];
  const context=[
    issue.issueType&&"Issue type: "+issue.issueType,
    issue.sourceUrl&&"Page URL: "+issue.sourceUrl,
    !issue.sourceUrl&&issue.sourcePath&&"Page path: "+issue.sourcePath,
    issue.browser&&"Browser: "+issue.browser+(issue.viewport?" ("+issue.viewport+")":""),
    !issue.browser&&issue.viewport&&"Viewport: "+issue.viewport,
    issue.evidenceLink&&"Evidence: "+issue.evidenceLink,
    attachmentCount>0&&"Attachments: "+attachmentCount+" (see the issue link)",
  ].filter((x):x is string=>Boolean(x));
  if(context.length)lines.push("","### Context",...context.map(x=>"- "+x));
  const engineering=[
    issue.resolution&&"Resolution: "+label(issue.resolution),
    issue.affectedLayer&&"Affected layer: "+label(issue.affectedLayer),
    trim(issue.rootCause)&&"Root cause: "+trim(issue.rootCause),
    trim(issue.fixNotes)&&"Fix notes: "+trim(issue.fixNotes),
    issue.frontendCommitSha&&"Frontend commit: `"+issue.frontendCommitSha+"`",
    issue.backendCommitSha&&"Backend commit: `"+issue.backendCommitSha+"`",
    issue.regressionTestStatus!=="NOT_REVIEWED"&&"Regression test: "+label(issue.regressionTestStatus),
    issue.retestStatus!=="NOT_RETESTED"&&"Retest: "+label(issue.retestStatus),
    issue.productionVerified&&"Verified in production",
  ].filter((x):x is string=>Boolean(x));
  if(engineering.length)lines.push("","### Engineering",...engineering.map(x=>"- "+x));
  return lines.join("\n");
}
export function TrackerIssueCopyActions({publicId,description,page,issue,attachmentCount=0}:Props){
  const [notice,setNotice]=useState<{tone:"success"|"error";message:string}|null>(null);
  async function copy(kind:"link"|"markdown"){
    const link=window.location.origin+"/tracker/issues/"+encodeURIComponent(publicId);
    const value=kind==="link"?link:issue?
      issueMarkdown(issue,link,attachmentCount):
      ["## "+publicId+" — "+page,"","### What went wrong",description,"","**Link:** "+link].join("\n");
    try{
      await navigator.clipboard.writeText(value);
      setNotice({tone:"success",message:kind==="link"?
        "Link to "+publicId+" copied":publicId+" copied as markdown"});
    }catch{
      setNotice({tone:"error",message:kind==="link"?
        "Could not copy the link — copy it from the address bar instead.":
        "Could not copy to the clipboard in this browser."});
    }
  }
  return <div className="flex min-w-0 flex-col items-stretch gap-2 md:flex-row md:items-center md:gap-3" aria-label="Issue sharing">
    <Button variant="secondary" type="button" className="min-h-11 w-full md:min-h-9 md:w-auto"
      onClick={()=>void copy("link")}>Copy link</Button>
    <Button variant="secondary" type="button" className="min-h-11 w-full md:min-h-9 md:w-auto"
      onClick={()=>void copy("markdown")}>Copy as markdown</Button>
    {notice?<InlineNotice tone={notice.tone} message={notice.message}/>:null}
  </div>;
}
