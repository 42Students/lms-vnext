import type {SafeSnapshot,JsonValue} from "@/modules/profile-verification/domain";
function asText(value:JsonValue|undefined):string {
 if(value===undefined)return "—";
 if(value===null)return "—";
 if(Array.isArray(value))return value.map(asText).join("; ");
 if(typeof value==="object")return "[structured details]";
 return String(value);
}
const sensitive=/aadhaar|pan|identity.?number|secret|token/i;
export function verificationSnapshotComparison(submitted:SafeSnapshot,verified:SafeSnapshot|null){
 const keys=Object.keys(submitted).filter(k=>!sensitive.test(k)).sort();
 return keys.map(key=>({key,submitted:asText(submitted[key]),previouslyVerified:verified?asText(verified[key]):"—",changed:verified!==null&&JSON.stringify(submitted[key])!==JSON.stringify(verified[key])}));
}
