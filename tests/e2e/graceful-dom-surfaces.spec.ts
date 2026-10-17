import { expect, test } from "@playwright/test";
import { expectNoRawErrors } from "./support/no-raw-error";

/**
 * GR-81: the page body can look harmless while assistive-technology labels,
 * tooltips, form hints or hidden live regions still leak implementation text.
 * All negative fixtures use synthetic content; there is no API or test user.
 */
const disclosures = [
  [
    "accessible button raw code",
    "<button aria-label=\"INTERNAL_ERROR\">Retry</button>"
  ],
  [
    "accessible unknown API code",
    "<button aria-label=\"NETWORK_FAILURE\">Retry</button>"
  ],
  [
    "accessible conflict status",
    "<button aria-label=\"VERSION_CONFLICT\">Retry</button>"
  ],
  [
    "accessible forbidden code",
    "<button aria-label=\"FORBIDDEN\">Retry</button>"
  ],
  [
    "accessible timeout code",
    "<button aria-label=\"GATEWAY_TIMEOUT\">Retry</button>"
  ],
  [
    "accessible raw exception",
    "<button aria-label=\"TypeError: fetch crashed\">Retry</button>"
  ],
  [
    "accessible SQL detail",
    "<button aria-label=\"relation &quot;students&quot; violates constraint\">Retry</button>"
  ],
  [
    "accessible network code",
    "<button aria-label=\"ECONNRESET connection\">Retry</button>"
  ],
  [
    "tooltip provider code",
    "<span title=\"DATABASE_UNAVAILABLE\">Information</span>"
  ],
  [
    "tooltip invalid request",
    "<span title=\"VALIDATION_FAILED\">Information</span>"
  ],
  [
    "tooltip 502",
    "<span title=\"HTTP 502\">Information</span>"
  ],
  [
    "tooltip stack trace",
    "<span title=\"at handle (src/work.ts:1:2)\">Information</span>"
  ],
  [
    "tooltip raw JSON",
    "<span title='{\"error\":\"INTERNAL_ERROR\"}'>Information</span>"
  ],
  [
    "placeholder raw code",
    "<input placeholder=\"RATE_LIMITED\" />"
  ],
  [
    "placeholder unknown code",
    "<input placeholder=\"SESSION_INVALID\" />"
  ],
  [
    "placeholder network details",
    "<input placeholder=\"ETIMEDOUT request\" />"
  ],
  [
    "hidden alert code",
    "<div role=\"alert\" style=\"display:none\">INTERNAL_ERROR</div>"
  ],
  [
    "hidden status code",
    "<div role=\"status\" style=\"display:none\">DATABASE_UNAVAILABLE</div>"
  ],
  [
    "hidden polite update",
    "<div aria-live=\"polite\" style=\"display:none\">NETWORK_FAILURE</div>"
  ],
  [
    "hidden assertive update",
    "<div aria-live=\"assertive\" style=\"display:none\">SESSION_EXPIRED</div>"
  ],
  [
    "visible polite update",
    "<p aria-live=\"polite\">RATE_LIMITED</p>"
  ],
  [
    "visible status embedded code",
    "<p role=\"status\">Try again: PAYMENT_FAILED</p>"
  ],
  [
    "nested live-region code",
    "<div role=\"status\"><span>Operation: </span><strong>GATEWAY_TIMEOUT</strong></div>"
  ],
  [
    "hidden SQL exception",
    "<p role=\"alert\" hidden>SELECT * FROM secrets</p>"
  ],
  [
    "hidden framework exception",
    "<p aria-live=\"polite\" hidden>Application error</p>"
  ],
  [
    "framework error overlay",
    "<vite-error-overlay></vite-error-overlay>"
  ]
] as const;

for (const [name, markup] of disclosures) {
  test(`GR-81 blocks ${name} in a browser DOM surface`, async ({ page }) => {
    await page.setContent(`<main>
      <h1>Could not save preferences</h1>
      <p>Something went wrong on our side. Please try again in a moment.</p>
      <a href="/">Go home</a>${markup}
    </main>`);
    await expect(expectNoRawErrors(page)).rejects.toThrow();
  });
}

test("GR-81 accepts helpful aria labels, placeholders and uppercase role badges", async ({ page }) => {
  await page.setContent(`<main>
    <h1>College profile editor</h1>
    <span>COLLEGE ADMIN</span>
    <p role="status">Your work is still here. You can try again.</p>
    <input aria-label="Display name" placeholder="Enter your full name" />
    <button aria-label="Retry saving">Retry</button>
    <span title="Last saved date">Recent changes</span>
    <a href="/">Go home</a>
  </main>`);
  await expectNoRawErrors(page);
});

test("GR-81 accepts a hidden polite message if it contains no raw code", async ({ page }) => {
  await page.setContent(`<main>
    <h1>Saved drafts</h1><p>All of your changes are preserved below.</p>
    <p aria-live="polite" hidden>We could not save this yet. Try again.</p>
    <a href="/">Go home</a>
  </main>`);
  await expectNoRawErrors(page);
});
