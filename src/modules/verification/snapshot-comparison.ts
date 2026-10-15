import type {SafeSnapshot,JsonValue} from "@/modules/profile-verification/domain";
const receiptKey=/(?:documentid|receiptid|objectkey|url|path|secret|token)$/i;
const identityKey=/^(aadhaarNumber|panNumber)$/i;
const masked=/^[*Xx•-]{4,}[A-Za-z0-9]{0,4}$/;
function flatten(value:JsonValue|undefined,path:string,out:Map<string,string>,depth:number){
 if(depth>6||!path||out.size>200)return;
 if(Array.isArray(value)){
  value.slice(0,50).forEach((item,index)=>flatten(item,`${path} [${index+1}]`,out,depth+1));
 }else if(value!==undefined&&value!==null&&typeof value==="object"){
  for(const [key,entry] of Object.entries(value)){
   if(receiptKey.test(key))continue;
   if(identityKey.test(key)&&!(typeof entry==="string"&&masked.test(entry)))continue;
   flatten(entry,path?path+" · "+key:key,out,depth+1);
  }
 }else out.set(path,value===null||value===undefined?"—":String(value).slice(0,2000));
}
/** Submitted and last-verified immutable snapshots, with private receipt IDs
 * and unsafe identity strings suppressed before reaching any presentation. */
export function verificationSnapshotComparison(submitted:SafeSnapshot,verified:SafeSnapshot|null){
 const newer=new Map<string,string>(),older=new Map<string,string>();
 for(const [key,value] of Object.entries(submitted)){
  if(!receiptKey.test(key)&&(!identityKey.test(key)||(typeof value==="string"&&masked.test(value))))
   flatten(value,key,newer,0);
 }
 if(verified)for(const [key,value] of Object.entries(verified)){
  if(!receiptKey.test(key)&&(!identityKey.test(key)||(typeof value==="string"&&masked.test(value))))
   flatten(value,key,older,0);
 }
 const keys=[...new Set([...newer.keys(),...older.keys()])].sort();
 return keys.map(key=>({key,submitted:newer.get(key)??"—",
  previouslyVerified:verified?older.get(key)??"—":"—",
  changed:verified!==null&&newer.get(key)!==older.get(key)}));
}
