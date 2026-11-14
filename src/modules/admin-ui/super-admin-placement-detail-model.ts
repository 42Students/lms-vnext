import {z} from "zod";
import { DEFAULT_TIME_ZONE } from "@/config/locale";
import { zUuid } from "@/lib/schema-primitives";
export type SuperAdminPlacementDetail={
 title:string;subtitle:string;status:string;backHref:string;
 facts:readonly {label:string;value:string}[];
 related?:{href:string;label:string};
};
export function readSuperAdminPlacementId(raw:unknown):string|null {
 const parsed=zUuid.safeParse(raw);
 return parsed.success?parsed.data:null;
}
export function placementDateIst(value:Date|null|undefined):string{
 return value?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:DEFAULT_TIME_ZONE}).format(value)+" IST":"Not recorded";
}
export function placementDateOnly(value:string|null|undefined):string{
 return value??"Not recorded";
}
