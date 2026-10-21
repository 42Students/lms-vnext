import {z} from "zod";
import {isIP} from "node:net";
import {availableSubdomainLabel} from "./college-subdomain-model";
import {normalizeTenantHost} from "./validation";
/** Legacy managed college labels are 3–30 characters, not arbitrary DNS 63. */
export const managedSubdomainLabelSchema=z.string().trim().toLowerCase().refine(
 label=>/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(label),{
 message:"Use 3–30 lowercase letters, numbers or hyphens (no leading or trailing hyphen).",
});
export const managedSubdomainRequest=z.strictObject({
 action:z.enum(["ALLOT","CHANGE","REMOVE"]),
 label:managedSubdomainLabelSchema.optional(),
 expectedHost:z.string().nullable(),
}).superRefine((value,ctx)=>{
 if(value.action!=="REMOVE"&&(!value.label||!availableSubdomainLabel(value.label)))
  ctx.addIssue({code:"custom",path:["label"],message:"Choose a subdomain not reserved for platform use. Try another name."});
 if(value.action==="REMOVE"&&value.label!==undefined)
  ctx.addIssue({code:"custom",path:["label"],message:"Remove does not accept a new address"});
});
export function managedBaseDomain(base:string|undefined,wildcardReady:boolean):string|null{
 if(!base||!wildcardReady)return null;
 // Validate the configured suffix itself. Adding a fake subdomain before URL
 // parsing can make a literal IP or malformed wildcard appear to be a DNS
 // hostname. Do not silently punycode or reinterpret Unicode configuration.
 if(!/^[a-z0-9.-]+$/i.test(base.trim()))return null;
 try{
  const host=normalizeTenantHost(base);
  if(host==="localhost"||host.endsWith(".localhost")||isIP(host)!==0)return null;
  return host;
 }catch{return null;}
}
export function managedHost(label:string,base:string){
 if(!managedSubdomainLabelSchema.safeParse(label).success||!availableSubdomainLabel(label))
  throw new Error("SUBDOMAIN_RESERVED_OR_INVALID: Use an available name of 3–30 characters.");
 return normalizeTenantHost(label+"."+base);
}
export function isManagedHost(host:string,base:string){
 // Suffix matching alone can misclassify an empty or invalid first label as a
 // managed address. Only a canonical, allocatable single DNS label is managed.
 if(!host.endsWith("."+base))return false;
 const label=host.slice(0,-(base.length+1));
 if(!managedSubdomainLabelSchema.safeParse(label).success||!availableSubdomainLabel(label))return false;
 try{return managedHost(label,base)===host;}catch{return false;}
}
