/** A company-memory link must not silently choose a value from duplicate
 * query keys or use unrecognized keys to switch between directory and detail. */
export function tpoCompanyFiltersShapeValid(raw:Record<string,unknown>):boolean{
 const allowed=new Set(["name","directory","search","page","pageSize","sort","discover","q"]);
 if(Object.keys(raw).some(key=>!allowed.has(key)))return false;
 if(Object.values(raw).some(value=>value!==undefined&&typeof value!=="string"))return false;
 if(typeof raw.name==="string"&&raw.name.trim().length>160)return false;
 if(raw.directory!==undefined&&raw.directory!=="1")return false;
 if(raw.discover!==undefined&&raw.discover!=="1")return false;
 return true;
}
