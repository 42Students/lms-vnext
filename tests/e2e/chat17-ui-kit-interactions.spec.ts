import { expect, test } from "@playwright/test";

const route="/e2e/chat17-ui-kit";

test.describe("UX-kit-E2E-01 real browser shared UI states",()=>{
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

  test("upload validates real FileList and toasts work without randomUUID",async({page})=>{
    await page.goto(route);
    const upload=page.locator("#harness-proof");
    await upload.setInputFiles({
      name:"wrong.exe",mimeType:"application/octet-stream",buffer:Buffer.from("payload"),
    });
    await expect(page.getByRole("alert")).toContainText("file type is not allowed");
    await expect(page.getByTestId("file-status")).toContainText("No file selected");

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
