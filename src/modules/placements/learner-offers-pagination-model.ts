import {z} from "zod";
export const learnerOfferPageSchema=z.coerce.number().int().min(1).max(10000);
export function paginateOwnOffers<T>(rows:readonly T[],requestedPage:number,pageSize=15){
 if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>50)throw new Error("INVALID_PAGE_SIZE");
 const total=rows.length;
 const pages=Math.max(1,Math.ceil(total/pageSize));
 const page=Number.isSafeInteger(requestedPage)?Math.max(1,Math.min(pages,requestedPage)):1;
 const start=(page-1)*pageSize;
 return {page,pages,total,from:total===0?0:start+1,to:Math.min(total,start+pageSize),items:rows.slice(start,start+pageSize)};
}
