import { expect, test } from "@playwright/test";

const route="/e2e/chat17-ui-kit";

test.describe("UX-kit-E2E-01 real browser shared UI states",()=>{
  test("UX-kit-HARDEN-49 browser-native required field validity follows the label",async({page})=>{
    await page.goto(route);
    const input=page.getByRole("textbox",{name:"Learner roll number"});
    await expect(input).toHaveAttribute("required","");
    await expect(input).toHaveAttribute("id","harness-roll");
    expect(await input.evaluate(el=>(el as HTMLInputElement).checkValidity())).toBe(false);
    await input.fill("24CS001");
    expect(await input.evaluate(el=>(el as HTMLInputElement).checkValidity())).toBe(true);
  });

  test("dialog focus restoration and tab keyboard selection skip unauthorized panels",async({page})=>{
    await page.goto(route);
    const opener=page.getByRole("button",{name:"Open harness dialog"});
    await opener.click();
    const dialog=page.getByRole("dialog",{name:"Harness confirmation"});
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Dialog input")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(opener).toBeFocused();

    const overview=page.getByRole("tab",{name:"Overview"});
    const restricted=page.getByRole("tab",{name:"Restricted"});
    const details=page.getByRole("tab",{name:"Details"});
    await expect(overview).toHaveAttribute("aria-selected","true");
    await expect(restricted).toBeDisabled();
    await overview.focus();
    await overview.press("ArrowRight");
    await expect(details).toHaveAttribute("aria-selected","true");
    await expect(page.getByRole("tabpanel")).toContainText("Details content");
    await expect(page.getByRole("tabpanel")).not.toContainText("Restricted data");
    await details.press("ArrowLeft");
    await expect(overview).toHaveAttribute("aria-selected","true");
  });

  test("UX-kit-E2E-06 pending confirmation resists Escape and double-submit", async ({page}) => {
    await page.goto(route);
    await page.getByRole("button",{name:"Review harness deletion"}).click();
    const dialog=page.getByRole("dialog",{name:"Delete harness workspace"});
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button",{name:"Delete",exact:true}).click();
    await expect(dialog.getByRole("button",{name:"Working…"})).toBeDisabled();
    await expect(dialog.getByRole("button",{name:"Cancel"})).toBeDisabled();
    await expect(page.getByTestId("confirm-invocations")).toHaveText("Confirmation requests: 1");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("confirm-invocations")).toHaveText("Confirmation requests: 1");
    await dialog.getByRole("button",{name:"Finish harness request"}).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("button",{name:"Review harness deletion"})).toBeFocused();
  });

  test("nested drawer/sheet owns only its own Back marker and never dismisses the parent",async({page})=>{
    await page.goto(route);
    await page.getByRole("button",{name:"Open harness drawer"}).click();
    const drawer=page.getByRole("dialog",{name:"Harness drawer"});
    const sheet=page.getByRole("dialog",{name:"Harness nested sheet"});
    await expect(drawer).toBeVisible();
    const drawerMarker=await page.evaluate(()=>history.state?.lmsOverlay);
    expect(typeof drawerMarker).toBe("string");

    await drawer.getByRole("button",{name:"Open nested sheet"}).click();
    await expect(sheet).toBeVisible();
    const sheetMarker=await page.evaluate(()=>history.state?.lmsOverlay);
    expect(sheetMarker).not.toBe(drawerMarker);
    await sheet.getByRole("button",{name:"Close nested sheet"}).click();
    await expect(sheet).not.toBeVisible();
    await expect.poll(()=>page.evaluate(()=>history.state?.lmsOverlay)).toBe(drawerMarker);
    await expect(drawer).toBeVisible();

    await page.evaluate(()=>history.back());
    await expect(drawer).not.toBeVisible();
    await expect(page.getByRole("button",{name:"Open harness drawer"})).toBeFocused();
  });

  test("scroll cues use measured edges and filter drawer works without matchMedia",async({page})=>{
    await page.setViewportSize({width:390,height:780});
    await page.goto(route);
    const cue=page.locator('[data-slot="scroll-cue"][data-axis="x"]');
    await expect(cue).toHaveAttribute("data-scroll-end","true");
    await expect(cue.getByRole("region",{name:"Harness horizontal overflow"})).toBeVisible();
    await cue.locator("div").first().evaluate(element => {
      element.scrollLeft=element.scrollWidth;
      element.dispatchEvent(new Event("scroll"));
    });
    await expect(cue).toHaveAttribute("data-scroll-start","true");
    await expect(cue).toHaveAttribute("data-scroll-end","false");

    await page.getByRole("button",{name:"Narrow scroll content"}).click();
    await expect(cue).toHaveAttribute("data-scroll-start","false");
    await expect(cue).toHaveAttribute("data-scroll-end","false");
    await expect(cue.getByRole("region",{name:"Harness horizontal overflow"})).toHaveCount(0);
    await page.getByRole("button",{name:"Widen scroll content"}).click();
    await expect(cue).toHaveAttribute("data-scroll-end","true");

    // Native host browser shims sometimes lack this standard API.
    await page.evaluate(() => {
      Object.defineProperty(window,"matchMedia",{configurable:true,value:undefined});
    });
    const open=page.getByRole("button",{name:"Task filters (1)"});
    await open.click();
    const drawer=page.getByRole("dialog",{name:"Task filters"});
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Assigned to me")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();
    await expect(open).toBeFocused();
  });

  test("UX-kit-E2E-10 scroll cue detects overflow when a second direct child resizes",async({page})=>{
    await page.goto(route);
    const cue=page.locator('[data-slot="scroll-cue"]').filter({has:page.getByText("First child remains small")});
    await expect(cue).toHaveAttribute("data-scroll-end","false");
    await page.getByRole("button",{name:"Grow second child"}).click();
    await expect(cue).toHaveAttribute("data-scroll-end","true");
    await expect(cue.getByRole("region",{name:"Second child resize overflow"})).toBeVisible();
    await page.getByRole("button",{name:"Shrink second child"}).click();
    await expect(cue).toHaveAttribute("data-scroll-end","false");
  });

  test("UX-kit-HARDEN-45 mobile More details never discloses desktop-only private columns",async({page})=>{
    await page.setViewportSize({width:390,height:780});
    await page.goto(route);
    const table=page.locator('[data-slot="data-table"]');
    await expect(table.locator("caption")).toHaveText("Project table privacy");
    await expect(table.getByText("DESKTOP_ONLY_PRIVATE_REVIEW")).toBeHidden();
    await table.locator("summary").filter({hasText:"More details"}).click();
    await expect(table.locator("details").getByText("Public field 4")).toBeVisible();
    await expect(table.getByText("DESKTOP_ONLY_PRIVATE_REVIEW")).toBeHidden();
    await page.setViewportSize({width:1200,height:780});
    await expect(table.getByText("DESKTOP_ONLY_PRIVATE_REVIEW")).toBeVisible();
  });

  test("UX-UNOWNED-TABLE-04 Super Admin interview grid filters and ICS download on mobile",async({page})=>{
    await page.setViewportSize({width:390,height:780});
    await page.goto(route);
    const section=page.getByRole("region",{name:"Interview operations"});
    await expect(section.getByText("Student Alpha")).toBeVisible();
    await expect(section.getByText("Student Beta")).toBeVisible();
    await expect(section.getByText("Venue double-booked").first()).toBeVisible();
    const department=section.getByLabel("Department");
    await department.selectOption("Design");
    await expect(section.getByText("Student Beta")).toBeVisible();
    await expect(section.getByText("Student Alpha")).toHaveCount(0);
    await section.getByRole("button",{name:"Clear filters"}).click();
    await expect(section.getByText("Student Alpha")).toBeVisible();
    const downloadPromise=page.waitForEvent("download");
    await section.getByRole("link",{name:".ics"}).first().click();
    const download=await downloadPromise;
    expect(download.suggestedFilename()).toBe("interview-interview-a.ics");
  });

  test("reduced-motion skeleton and native disclosure remain keyboard accessible",async({page})=>{
    await page.emulateMedia({reducedMotion:"reduce"});
    await page.goto(route);
    const shimmer=page.locator('[data-slot="skeleton"] .lms-skeleton-shimmer').first();
    await expect(shimmer).toBeAttached();
    const duration=await shimmer.evaluate(element =>
      Number.parseFloat(getComputedStyle(element,"::after").animationDuration));
    expect(Number.isFinite(duration)).toBe(true);
    expect(duration).toBeLessThanOrEqual(0.01);

    const disclosure=page.locator('[data-slot="disclosure"]');
    await expect(page.getByText("Disclosed workspace details")).toBeHidden();
    const summary=disclosure.locator("summary");
    await summary.focus();
    await summary.press("Enter");
    await expect(disclosure).toHaveAttribute("open","");
    await expect(page.getByText("Disclosed workspace details")).toBeVisible();
    await summary.press("Space");
    await expect(page.getByText("Disclosed workspace details")).toBeHidden();
  });

  test("UX-kit-E2E-07 disabled controls expose their reason to keyboard users",async({page})=>{
    await page.goto(route);
    const group=page.getByRole("group").filter({hasText:"Assign a learner before submitting."});
    await group.focus();
    await expect(group).toBeFocused();
    const action=group.getByRole("button",{name:"Submit unassigned project"});
    await expect(action).toBeDisabled();
    const reasonId=await group.getAttribute("aria-describedby");
    expect(reasonId).toBeTruthy();
    await expect(group.locator('[id="'+reasonId+'"]')).toHaveText("Assign a learner before submitting.");
  });

  test("UX-kit-E2E-08 success notice waits until a hidden document is visible",async({page})=>{
    await page.goto(route);
    await page.evaluate(()=>{
      Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.getByRole("button",{name:"Show inline saved notice"}).click();
    const note=page.getByRole("status").filter({hasText:"Saved inline workspace update"});
    await expect(note).toBeVisible();
    await page.waitForTimeout(1000);
    await expect(note).toBeVisible();
    await page.evaluate(()=>{
      Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(note).toHaveCount(0,{timeout:3500});
  });

  test("UX-kit-E2E-11 timed toasts remain readable when the tab is hidden",async({page})=>{
    await page.goto(route);
    await page.evaluate(()=>{
      Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.getByRole("button",{name:"Show success notice"}).click();
    const toast=page.getByRole("status").filter({hasText:"Saved harness result"});
    await expect(toast).toBeVisible();
    await page.waitForTimeout(5200);
    await expect(toast).toBeVisible();
    await page.evaluate(()=>{
      Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(toast).toHaveCount(0,{timeout:9000});
  });

  test("UX-kit-E2E-09 upload retains external help and Tabs honor reduced motion",async({page})=>{
    await page.emulateMedia({reducedMotion:"reduce"});
    await page.goto(route);
    const upload=page.locator("#harness-proof");
    const descriptions=await upload.getAttribute("aria-describedby");
    expect(descriptions?.split(/\s+/)).toContain("harness-external-help");
    expect(descriptions?.split(/\s+/)).toContain("harness-proof-help");
    const transition=await page.getByRole("tab",{name:"Overview"}).evaluate(el=>
      getComputedStyle(el).transitionDuration);
    expect(transition).toBe("0s");
  });

  test("upload validates real FileList and toasts work without randomUUID",async({page})=>{
    await page.goto(route);
    const upload=page.locator("#harness-proof");
    await upload.setInputFiles({
      name:"wrong.exe",mimeType:"application/octet-stream",buffer:Buffer.from("payload"),
    });
    await expect(page.getByRole("alert")).toContainText("file type is not allowed");
    await expect(page.getByTestId("file-status")).toContainText("No file selected");

    await page.getByRole("button",{name:"Disable file selection"}).click();
    await expect(upload).toBeDisabled();
    await expect(page.getByRole("alert").filter({hasText:"file type is not allowed"}))
      .toHaveCount(0);
    await expect(upload).not.toHaveAttribute("aria-invalid","true");
    await page.getByRole("button",{name:"Enable file selection"}).click();
    await expect(upload).toBeEnabled();

    await upload.setInputFiles({
      name:"huge.pdf",mimeType:"application/pdf",buffer:Buffer.alloc(2048),
    });
    await expect(page.getByRole("alert")).toContainText("larger than the allowed limit");
    await expect(page.getByTestId("file-status")).toContainText("No file selected");

    await upload.setInputFiles({
      name:"valid.pdf",mimeType:"application/pdf",buffer:Buffer.from("%PDF-1.7 valid"),
    });
    await expect(page.getByTestId("file-status")).toContainText("Selected: valid.pdf");

    await page.getByRole("button",{name:"Disable file selection"}).click();
    await expect(upload).toBeDisabled();
    await expect(page.getByTestId("file-status")).toContainText("No file selected");
    await page.getByRole("button",{name:"Enable file selection"}).click();
    await expect(upload).toBeEnabled();
    await upload.setInputFiles({
      name:"second.pdf",mimeType:"application/pdf",buffer:Buffer.from("%PDF-1.7 second"),
    });
    await expect(page.getByTestId("file-status")).toContainText("Selected: second.pdf");

    await page.evaluate(() => {
      Object.defineProperty(window.crypto,"randomUUID",{configurable:true,value:undefined});
    });
    await page.getByRole("button",{name:"Show success notice"}).click();
    await page.getByRole("button",{name:"Show error notice"}).click();
    const success=page.getByRole("status").filter({hasText:"Saved harness result"});
    const failure=page.getByRole("alert").filter({hasText:"Harness save failed"});
    await expect(success).toBeVisible();
    await expect(failure).toBeVisible();
    await page.getByRole("button",{name:"Dismiss error: Harness save failed"}).click();
    await expect(failure).not.toBeVisible();
  });
});
