import { expect, it } from "vitest";
import { dedupeBatch } from "@/modules/messaging/batch-dedupe";
const a = {channel: "EMAIL" as const, recipient: "A@EXAMPLE.COM", purpose:"campaign", templateKey:"contact", variables:{}};
it("deduplicates canonical recipients without combining distinct purposes",()=>{
 expect(dedupeBatch([a,{...a,recipient:"a@example.com"},{...a,purpose:"notice"}])).toHaveLength(2);
});
