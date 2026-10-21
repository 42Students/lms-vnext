"use client";
import {Button} from "@/components/ui/button";
import {useToast} from "@/components/ui/toast";

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
  const {showToast}=useToast();
  async function copy(kind:"link"|"markdown"){
    const link=window.location.origin+"/tracker/issues/"+encodeURIComponent(publicId);
    const value=kind==="link"?link:issue?
      issueMarkdown(issue,link,attachmentCount):
      ["## "+publicId+" — "+page,"","### What went wrong",description,"","**Link:** "+link].join("\n");
    try{
      await navigator.clipboard.writeText(value);
      showToast({tone:"success",title:kind==="link"?
        "Link to "+publicId+" copied":publicId+" copied as markdown"});
    }catch{
      showToast({tone:"error",title:kind==="link"?
        "Could not copy the link — copy it from the address bar instead.":
        "Could not copy to the clipboard in this browser."});
    }
  }
  return <div className="flex min-w-0 flex-col items-stretch gap-2 md:flex-row md:items-center md:gap-3" aria-label="Issue sharing">
    <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-9 sm:px-2 md:min-h-9"
      aria-label="Copy issue link" title="Copy link" onClick={()=>void copy("link")}>
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      <span className="sr-only">Copy link</span>
    </Button>
    <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-9 sm:px-2 md:min-h-9"
      aria-label="Copy issue as markdown" title="Copy as markdown" onClick={()=>void copy("markdown")}>
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 4H5a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-2M6 15v-6l3 3 3-3v6M16 9v6m-2-2 2 2 2-2"/></svg>
      <span className="sr-only">Copy as markdown</span>
    </Button>
  </div>;
}
