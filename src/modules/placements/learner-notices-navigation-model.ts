export function learnerNoticeFilterHref(x:{pinned:boolean;unread:boolean;recent:boolean;q:string;sort?:"pinned"|"latest"|"oldest"}):string{
 const query=new URLSearchParams();
 if(x.pinned)query.set("pinned","1");
 if(x.unread)query.set("unread","1");
 if(x.recent)query.set("recent","1");
 if(x.q)query.set("q",x.q);
 if(x.sort&&x.sort!=="pinned")query.set("sort",x.sort);
 const tail=query.toString();
 return "/learn/my-placements/announcements"+(tail?"?"+tail:"");
}
