export function verificationLastPage(total:number,pageSize:number):number{
 if(!Number.isInteger(total)||total<0||![10,25,50].includes(pageSize))throw new Error("INVALID_VERIFICATION_PAGING");
 return Math.max(1,Math.ceil(total/pageSize));
}
export function verificationPageUrl(filter:Record<string,string|number|undefined>,page:number){
 const params=new URLSearchParams();
 for(const [key,value] of Object.entries(filter)){
  if(value!==undefined&&value!==""&&key!=="page")params.set(key,String(value));
 }
 params.set("page",String(page));
 return "/college/verification?"+params.toString();
}
