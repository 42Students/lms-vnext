/** Return the boundary to focus when a keyboard Tab would leave a modal. */
export function verificationFocusWrap(
 currentIsFirst:boolean,currentIsLast:boolean,shiftKey:boolean
):"FIRST"|"LAST"|null {
 if(shiftKey&&currentIsFirst)return "LAST";
 if(!shiftKey&&currentIsLast)return "FIRST";
 return null;
}
