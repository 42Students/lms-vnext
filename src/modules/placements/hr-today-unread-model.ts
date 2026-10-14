export function hrTodayUnreadAction(input:{
 status:string;unread:number;truncated:boolean;collegeId:string;
}) {
 if(input.status!=="READY")return null;
 return {
  label:input.truncated?"Unread notifications (first 100)":"Unread notifications",
  value:input.unread,
  url:"/hr/messages?collegeId="+encodeURIComponent(input.collegeId)+"&unreadOnly=true",
 };
}
