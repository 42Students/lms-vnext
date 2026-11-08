import { expect,test } from "@playwright/test";

for(const viewport of [
 {name:"desktop",width:1280,height:800},
 {name:"mobile",width:390,height:844},
] as const){
 test(`Telegram copy ${viewport.name}: safe diagnostics and durable acknowledgement`,async({page},info)=>{
  await page.setViewportSize(viewport);
  await page.goto("/e2e/ux-g176-telegram-alert");
  await expect(page.getByRole("heading",{name:"Telegram incident copy acceptance"})).toBeVisible();
  const outbound=page.getByTestId("outbound-alert-copy");
  await expect(outbound).toContainText("Time: 2099-01-01T01:02:03.000Z");
  await expect(outbound).toContainText("Request ID: af02b19c");
  await expect(outbound).toContainText("Deploy: aabbccddee");
  await expect(outbound).not.toContainText("alice@example.com");
  await expect(page.getByTestId("acknowledge-label")).toHaveText("✅ Acknowledge");
  await expect(page.getByTestId("callback-target")).toHaveText("ack:11111111-1111-4111-8111-111111111111");
  const acknowledged=page.getByTestId("acknowledged-alert-copy");
  await expect(acknowledged).toContainText("Request ID: af02b19c");
  await expect(acknowledged).not.toContainText("alice@example.com");
  expect((await acknowledged.textContent())?.split("✅ Acknowledged")).toHaveLength(2);
  expect((await acknowledged.textContent())?.trimEnd().endsWith("✅ Acknowledged")).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
  await page.screenshot({path:info.outputPath(`telegram-alert-copy-${viewport.name}.png`),fullPage:true});
 });
}
