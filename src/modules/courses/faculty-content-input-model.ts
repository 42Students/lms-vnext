/** Legacy-compliant, explicit authoring errors before an HTTP write. */
export function facultyYouTubeLinkIssue(value:string):string|null{
 try{
  const url=new URL(value);
  const host=url.hostname.toLowerCase();
  const ok=url.protocol==="https:"&&!url.username&&!url.password&&
   (host==="youtube.com"||host==="www.youtube.com"||
    host==="m.youtube.com"||host==="youtu.be");
  const validPath=host==="youtu.be"?/^\/[a-zA-Z0-9_-]{11}\/?$/.test(url.pathname):
   url.pathname==="/watch"?/^[a-zA-Z0-9_-]{11}$/.test(url.searchParams.get("v")??""):
   /^\/shorts\/[a-zA-Z0-9_-]{11}\/?$/.test(url.pathname);
  return ok&&validPath?null:"Paste a YouTube video link (watch, youtu.be or Shorts)";
 }catch{return "Paste a YouTube video link (watch, youtu.be or Shorts)";}
}
export function facultyLiveClassIssue(urlValue:string,startValue:string,endValue:string,now=new Date()):string|null{
 try{
  const url=new URL(urlValue);
  const host=url.hostname.toLowerCase();
  const providers=["zoom.us","teams.microsoft.com","meet.google.com","webex.com","whereby.com"];
  if(url.protocol!=="https:"||url.username||url.password||
     !providers.some(item=>host===item||host.endsWith("."+item)))
   return "Use a meeting link from Zoom, Microsoft Teams, Google Meet, Webex or Whereby.";
 }catch{return "Use a meeting link from Zoom, Microsoft Teams, Google Meet, Webex or Whereby.";}
 const start=new Date(startValue),end=new Date(endValue);
 if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime()))
  return "Choose valid start and end times.";
 if(start.getUTCMinutes()%15!==0||start.getUTCSeconds()!==0||
    end.getUTCMinutes()%15!==0||end.getUTCSeconds()!==0)
  return "Choose 15-minute start and end times in IST.";
 if(end<=start)return "End time must be after start time";
 if(end.getTime()-start.getTime()>12*60*60*1000)
  return "A live class can be at most 12 hours. Check the end date and AM/PM.";
 if(start<=now)return "Start time must be in the future.";
 return null;
}
