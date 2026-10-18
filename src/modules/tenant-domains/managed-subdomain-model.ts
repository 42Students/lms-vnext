import {z} from "zod";
import {isIP} from "node:net";
import {availableSubdomainLabel,subdomainLabelSchema} from "./college-subdomain-model";
import {normalizeTenantHost} from "./validation";
export const managedSubdomainRequest=z.strictObject({
 action:z.enum(["ALLOT","CHANGE","REMOVE"]),
 label:subdomainLabelSchema.optional(),
 expectedHost:z.string().nullable(),
}).superRefine((value,ctx)=>{
 if(value.action!=="REMOVE"&&(!value.label||!availableSubdomainLabel(value.label)))
  ctx.addIssue({code:"custom",path:["label"],message:"Choose an available subdomain name"});
 if(value.action==="REMOVE"&&value.label!==undefined)
  ctx.addIssue({code:"custom",path:["label"],message:"Remove does not accept a new address"});
});
export function managedBaseDomain(base:string|undefined,wildcardReady:boolean):string|null{
 if(!base||!wildcardReady)return null;
 try{
  const host=normalizeTenantHost("test."+base);
  if(!host.startsWith("test."))return null;
  const suffix=host.slice(5);
  // Prefixing with "test." makes even a literal IPv4 address look like a
  // valid DNS hostname to normalizeTenantHost. Reject the suffix itself.
  if(suffix.split(".").length<2||suffix==="localhost"||isIP(suffix)!==0)return null;
  return suffix;
 }catch{return null;}
}
export function managedHost(label:string,base:string){
 if(!availableSubdomainLabel(label))throw new Error("SUBDOMAIN_RESERVED_OR_INVALID");
 return normalizeTenantHost(label+"."+base);
}
export function isManagedHost(host:string,base:string){
 // Suffix matching alone can misclassify an empty or invalid first label as a
 // managed address. Only a canonical, allocatable single DNS label is managed.
 if(!host.endsWith("."+base))return false;
 const label=host.slice(0,-(base.length+1));
 if(!availableSubdomainLabel(label))return false;
 try{return managedHost(label,base)===host;}catch{return false;}
}
