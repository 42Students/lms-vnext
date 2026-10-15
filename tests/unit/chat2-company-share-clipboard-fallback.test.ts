import {describe,it,expect,vi} from "vitest";
import {copyCompanyShareUrl} from "../../src/modules/placements/company-share/copy-model";
describe("one-time company-share URL clipboard",()=>{
 it("reports copy success without returning the token",async()=>{
  const writer=vi.fn(async (_url:string)=>undefined);
  expect(await copyCompanyShareUrl("https://example.test/company-share/secret",writer)).toBe("COPIED");
  expect(writer).toHaveBeenCalledOnce();
 });
 it("falls back to manual copy without dropping the source URL",async()=>{
  expect(await copyCompanyShareUrl("secret",async()=>{throw new Error("Clipboard denied");})).toBe("MANUAL_COPY");
 });
});
