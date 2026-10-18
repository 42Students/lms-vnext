/** Keep teaching previews on the same HTTPS media origins accepted by authoring. */
export function facultyContentExternalHref(kind:string,value:string|null){
 if(!value||!["YOUTUBE","RESOURCE","LIVE_CLASS"].includes(kind))return null;
 try{
  const parsed=new URL(value);
  if(parsed.protocol!=="https:"||parsed.username||parsed.password)return null;
  if(kind==="YOUTUBE"&&!["youtube.com","www.youtube.com","m.youtube.com",
    "youtu.be","www.youtube-nocookie.com"].includes(parsed.hostname.toLowerCase()))return null;
  return parsed.toString();
 }catch{return null;}
}

/** Strict video ID projection; never embed an untrusted arbitrary URL. */
export function facultyYouTubeEmbed(value:string|null){
 const href=facultyContentExternalHref("YOUTUBE",value);
 if(!href)return null;
 const url=new URL(href);
 const segments=url.pathname.split("/");
 const id=url.hostname==="youtu.be" ? segments[1] :
  (["shorts","embed","live"].includes(segments[1] ?? "") ? segments[2] :
   url.searchParams.get("v"));
 return id&&/^[A-Za-z0-9_-]{11}$/.test(id)?
  "https://www.youtube-nocookie.com/embed/"+id:null;
}
