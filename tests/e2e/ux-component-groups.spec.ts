import { expect, test } from "@playwright/test";

/** Development-only synthetic fixtures: no staff identity, credentials or real mutations. */
const sizes = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const;
for (const size of sizes) {
  test(`UX-G130 ${size.name} stored settings filter, pagination and discard`, async ({ page }) => {
    await page.setViewportSize(size);
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto("/e2e/ux-component-groups");
    const group = page.getByRole("region", { name: "UX-G130 stored settings" });
    await expect(group.getByText("Showing 50 of 72 matching keys")).toBeVisible();
    const filter = group.getByRole("searchbox", { name: "Find a setting by key" });
    await filter.fill("demo.group.071");
    await expect(group.getByText("1 of 72 key names match")).toBeVisible();
    await expect(group.getByText("demo.group.071")).toBeVisible();
    await filter.fill("not-a-key");
    await expect(group.getByText(/No stored key names match your search/)).toBeVisible();
    await group.getByRole("button", { name: "Clear search" }).click();
    await group.getByRole("button", { name: /Show next 22 keys/ }).click();
    await expect(group.getByText("demo.group.072")).toBeVisible();
    await group.getByRole("button", { name: "Add setting" }).click();
    const dialog = page.getByRole("dialog", { name: "Add a setting" });
    await dialog.getByRole("textbox", { name: "Key" }).fill("9invalid");
    await expect(dialog.getByRole("alert")).toContainText("Start with a letter");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("alertdialog", { name: "Discard this new setting?" })).toBeVisible();
    await page.getByRole("alertdialog").getByRole("button", { name: "Keep editing" }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Discard" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(group.getByRole("region", { name: /Other stored settings table/ })).toHaveAttribute("tabindex", "0");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
  test(`UX-G140 ${size.name} elective no-op prevention and discard recovery`, async ({ page }) => {
    await page.setViewportSize(size);
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto("/e2e/ux-component-groups");
    const group = page.getByRole("region", { name: "UX-G140 elective slot" });
    await expect(group.getByText(/Create a program in this college/)).toBeVisible();
    await expect(group.getByRole("button", { name: "New slot" })).toBeDisabled();
    await group.getByRole("button", { name: /Edit elective slot Synthetic/ }).click();
    const dialog = page.getByRole("dialog", { name: "Edit Elective Slot" });
    const save = dialog.getByRole("button", { name: "Save Changes" });
    await expect(save).toBeDisabled();
    await expect(dialog.getByRole("status")).toContainText("No changes to save yet");
    const name = dialog.getByRole("textbox", { name: "Slot name" });
    await name.fill("A safer edited title");
    await expect(save).toBeEnabled();
    await expect(dialog.getByRole("status")).toContainText("Unsaved changes");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("alertdialog", { name: "Discard elective slot edits?" })).toBeVisible();
    await page.getByRole("alertdialog").getByRole("button", { name: "Keep editing" }).click();
    await expect(name).toHaveValue("A safer edited title");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Discard changes" }).click();
    await expect(dialog).toHaveCount(0);
    await group.getByRole("button", { name: /Edit elective slot Synthetic/ }).click();
    await expect(page.getByRole("dialog").getByRole("textbox", { name: "Slot name" }))
      .toHaveValue("Synthetic elective slot");
    await expect(page.getByRole("dialog").getByRole("button", { name: "Save Changes" })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
  test(`UX-G126 ${size.name} activity table and learner inbox empty recovery`, async ({ page }) => {
    await page.setViewportSize(size);
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto("/e2e/ux-component-groups");
    const activity = page.getByRole("region", { name: "UX-G126 activity", exact: true });
    await expect(activity.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/activity?view=all");
    await activity.getByText("Raw forensic table · current page").click();
    const table = activity.getByRole("region", { name: /Raw forensic activity table/ });
    await expect(table).toBeVisible();
    await expect(table).toHaveAttribute("tabindex", "0");
    await table.focus();
    await expect(table).toBeFocused();
    const inbox = page.getByRole("region", { name: "UX-G126 learner inbox" });
    const search = inbox.getByRole("searchbox", { name: "Search notifications" });
    await expect(inbox.getByText(/Results filter as you type/)).toBeVisible();
    await search.fill("no matching message");
    await inbox.getByRole("button", { name: "Clear filters and show all" }).click();
    await expect(search).toHaveValue("");
    await expect(inbox.getByText("Synthetic project update").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
