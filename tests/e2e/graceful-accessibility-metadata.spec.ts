import { expect, test } from "@playwright/test";
import { expectNoRawErrors } from "./support/no-raw-error";

/**
 * GR-81: hostile backend identifiers are never acceptable in customer-facing
 * accessibility metadata, even if the main visible page is perfectly calm.
 * All content is synthetic: these tests neither sign in nor mutate data.
 */
const surfaces = [
  [
    "image alt text",
    "<img src=\"data:,\" alt=\"%CODE%\" />"
  ],
  [
    "ARIA description",
    "<button aria-description=\"%CODE%\">Retry now</button>"
  ],
  [
    "ARIA value text",
    "<div role=\"progressbar\" aria-valuemin=\"0\" aria-valuemax=\"100\" aria-valuenow=\"0\" aria-valuetext=\"%CODE%\">Progress</div>"
  ],
  [
    "tooltip attribute",
    "<button data-tooltip=\"%CODE%\">Retry now</button>"
  ],
  [
    "server diagnostic attribute",
    "<span data-error=\"%CODE%\">Save status</span>"
  ],
  [
    "message diagnostic attribute",
    "<output data-message=\"%CODE%\">Please try again later</output>"
  ],
  [
    "hidden ARIA-describedby target",
    "<button aria-describedby=\"recovery-hint\">Retry</button><p id=\"recovery-hint\" hidden>%CODE%</p>"
  ],
  [
    "hidden ARIA-labelledby target",
    "<button aria-labelledby=\"recovery-label\">Retry</button><span id=\"recovery-label\" hidden>%CODE%</span>"
  ]
] as const;
const internalCodes = ["SESSION_INVALID","PAYMENT_GATEWAY_FAILURE","QUERY_EXECUTION_FAILED","INVALID_PROVIDER_RESPONSE"] as const;

for (const [surface, html] of surfaces) {
  for (const code of internalCodes) {
    test(`GR-81 rejects ${code} in ${surface}`, async ({ page }) => {
      await page.setContent(`<main>
        <h1>Could not save your changes</h1>
        <p>Your changes are still here. Try again shortly.</p>
        <a href="/">Go home</a>
        ${html.replace("%CODE%", code)}
      </main>`);
      await expect(expectNoRawErrors(page)).rejects.toThrow();
    });
  }
}

test("GR-81 allows helpful alt text, ARIA descriptions, and tooltip instructions",
  async ({ page }) => {
    await page.setContent(`<main>
      <h1>Save your work</h1>
      <p>Your edits are kept below. You can try again.</p>
      <img src="data:," alt="Campus logo"/>
      <button aria-description="Keep the form open while retrying"
        data-tooltip="Try to save your changes again">Try again</button>
      <div role="progressbar" aria-valuemin="0" aria-valuemax="100"
        aria-valuenow="0" aria-valuetext="Not started">Progress</div>
      <span data-error="A retry may be needed" data-message="Saved work stays here">Notice</span>
      <a href="/">Go home</a>
    </main>`);
    await expectNoRawErrors(page);
  });

test("GR-81 allows hidden ARIA references with useful readable recovery advice",
  async ({ page }) => {
    await page.setContent(`<main>
      <h1>Account preferences</h1>
      <p>We could not save your changes. Please try again.</p>
      <button aria-labelledby="safe-label" aria-describedby="safe-hint">Retry</button>
      <span id="safe-label" hidden>Try again</span>
      <p id="safe-hint" hidden>Your unsaved edits will remain here.</p>
      <a href="/">Go home</a>
    </main>`);
    await expectNoRawErrors(page);
  });
