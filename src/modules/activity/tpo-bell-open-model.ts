/** A bell destination must be a relative, same-origin application path. */
export function tpoBellOpenHref(href:string|null):string|null {
 if(!href||!href.startsWith("/")||href.startsWith("//")||href.includes("\\"))return null;
 return href;
}
