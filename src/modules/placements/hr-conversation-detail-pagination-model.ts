export function hrConversationDetailPageWindow(requestedPage:number,total:number){
 const pages=Math.max(1,Math.ceil(Math.max(0,total)/40));
 const page=Math.max(1,Math.min(Math.floor(requestedPage),pages));
 return {page,pages,offset:(page-1)*40};
}
