import {z} from "zod";
export const inboundMailDetailSchema=z.strictObject({
 id:z.uuid(),status:z.enum(["NEW","TRIAGED","RESOLVED"]),
 fromAddress:z.email(),toAddress:z.email(),subject:z.string().max(512),
 receivedAt:z.iso.datetime({offset:true}),plainText:z.string().max(100000),
});
export function safeMailDrawerText(value:string) {
 return value.replace(/\u0000/g,"").slice(0,100000);
}
