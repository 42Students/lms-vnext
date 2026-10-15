/** Only link to a safely parsed HTTPS URL already present in the stored message. No HTML is rendered. */
export function safeAnnouncementLink(message:string):string|null {
 const match=message.match(/https:\/\/[^\s<>"']+/i);
 if(!match)return null;
 const candidate=match[0].replace(/[.,;!?)]+$/,"");
 if(candidate.length>2048)return null;
 try {const url=new URL(candidate);
  if(url.protocol!=="https:"||!url.hostname||url.username||url.password)return null;
  return url.toString();
 } catch{return null;}
}
