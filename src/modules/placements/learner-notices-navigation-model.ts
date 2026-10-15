export function learnerNoticeFilterHref(x:{pinned:boolean;unread:boolean;recent:boolean;q:string;sort?:"pinned"|"latest"|"oldest";alertQ?:string;source?:"all"|"placement-cell"}):string{
 const query=new URLSearchParams();
 if(x.pinned)query.set("pinned","1");
 if(x.unread)query.set("unread","1");
 if(x.recent)query.set("recent","1");
 if(x.q)query.set("q",x.q);
 if(x.alertQ)query.set("alertQ",x.alertQ);
 if(x.source==="placement-cell")query.set("source","placement-cell");
 if(x.sort&&x.sort!=="pinned")query.set("sort",x.sort);
 const tail=query.toString();
 return "/learn/my-placements/announcements"+(tail?"?"+tail:"");
}

/** Keep the independently-filtered personal alert search when paging college notices. */
export function learnerNoticePageHref(x:{
 pinned:boolean;unread:boolean;recent:boolean;q:string;
 alertQ?:string;source?:"all"|"placement-cell";sort?:"pinned"|"latest"|"oldest";page:number;
}):string{
 if(!Number.isSafeInteger(x.page)||x.page<1||x.page>9999)throw new Error("INVALID_NOTICE_PAGE");
 const base=learnerNoticeFilterHref(x);
 return base+(base.includes("?")?"&":"?")+"page="+x.page;
}
