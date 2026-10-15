import type {CompanyShareStatus} from "./status-model";
export function afterCompanyShareRevocation<T extends {id:string;revokedAt:string|null}>(
 links:readonly T[],id:string,status:CompanyShareStatus,revokedAt:string,
):T[]{
 if(status==="ACTIVE"||status==="EXPIRED")return links.filter(item=>item.id!==id);
 return links.map(item=>item.id===id?{...item,revokedAt}:item);
}
