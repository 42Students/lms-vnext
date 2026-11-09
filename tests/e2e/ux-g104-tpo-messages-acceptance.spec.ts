import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";

test.skip(!process.env.E2E_AUTH_SECRET,"Authenticated browser E2E requires the disposable E2E identity harness");

test("UX-G104 TPO starts a recruiter conversation and verifies it on desktop and mobile",async({page,context},info)=>{
  test.setTimeout(120_000);
  await authenticateGracefulRole(context,"tpo");
  await page.setViewportSize({width:1280,height:800});
  await page.goto("/tpo/messages");
  await expect(page.getByRole("heading",{level:1,name:"Messages"})).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await info.attach("g104-tpo-inbox-mobile",{body:await page.screenshot({fullPage:true}),contentType:"image/png"});
  await page.setViewportSize({width:1280,height:800});
  await page.getByRole("button",{name:"New message"}).click();
  const dialog=page.getByRole("dialog",{name:"New message to a recruiter"});
  const recruiter=dialog.getByRole("combobox",{name:"Recruiter"});
  const recruiterValue=await recruiter.locator("option").evaluateAll(options=>{
    const match=options.find(option=>option.textContent?.includes("E2E Prototype Recruiter"));
    return match instanceof HTMLOptionElement?match.value:"";
  });
  expect(recruiterValue).not.toBe("");
  await recruiter.selectOption(recruiterValue);
  const message=`UX-G104 end-to-end message ${Date.now()}`;
  await dialog.getByRole("textbox",{name:"New message"}).fill(message);
  const sent=page.waitForResponse(response=>
    response.url().includes("/api/placements/tpo/messages/threads/")&&
    response.url().endsWith("/messages")&&response.request().method()==="POST",
  );
  await dialog.getByRole("button",{name:"Send"}).click();
  expect((await sent).ok()).toBe(true);
  await expect(page.getByRole("heading",{level:1,name:"E2E Prototype Recruiter"})).toBeVisible();
  await expect(page.getByRole("log",{name:"Conversation messages"}).getByText(message,{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await info.attach("g104-tpo-messages-desktop",{body:await page.screenshot({fullPage:true}),contentType:"image/png"});

  await page.setViewportSize({width:390,height:844});
  await page.reload();
  await expect(page.getByRole("heading",{level:1,name:"E2E Prototype Recruiter"})).toBeVisible();
  await expect(page.getByRole("log",{name:"Conversation messages"}).getByText(message,{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await info.attach("g104-tpo-messages-mobile",{body:await page.screenshot({fullPage:true}),contentType:"image/png"});

  const threadUrl=page.url();
  await authenticateGracefulRole(context,"learner");
  await page.goto(threadUrl);
  await expect(page).toHaveURL(/\/learn\/courses\?access=denied/);
  await expect(page.getByText(message,{exact:true})).toHaveCount(0);
});
