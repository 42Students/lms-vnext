/** A drive's description: HTML on the drive, plain text in forms, and older escaped ones shown as they were meant (night audit 13 Oct 2026). */
import React from "react";
import { render, screen } from "@testing-library/react";
import RichTextDisplay from "@/components/Global/RichTextEditor/RichTextDisplay";
import { descriptionHtml, descriptionText, unescapeStoredHtml } from "@/utils/driveDescription";

test("plain text becomes paragraphs with its line breaks, safely escaped", () => {
  expect(descriptionHtml("Role: SDE\nPune\n\nBring <your> resume & ID")).toBe("<p>Role: SDE<br>Pune</p><p>Bring &lt;your&gt; resume &amp; ID</p>");
  expect(descriptionHtml("  ")).toBe("");
});

test("HTML and escaped HTML read back as the text a person edits", () => {
  expect(descriptionText("<p>Role: <strong>SDE</strong></p><ul><li>Java</li><li>SQL</li></ul>")).toBe("Role: SDE\n\n• Java\n• SQL");
  expect(descriptionText("&lt;p&gt;Everything&lt;/p&gt;")).toBe("Everything");
  expect(descriptionText(descriptionHtml("A\n\nB"))).toBe("A\n\nB");
});

test("only HTML that was escaped once too often is unescaped", () => {
  expect(unescapeStoredHtml("&lt;p&gt;Everything&lt;/p&gt;")).toBe("<p>Everything</p>");
  expect(unescapeStoredHtml("<p>Use &lt;br&gt; for a line</p>")).toBe("<p>Use &lt;br&gt; for a line</p>");
  expect(unescapeStoredHtml("Salary &amp; perks")).toBe("Salary &amp; perks");
});

test("students see an older escaped description as text, not as tags", () => {
  const { container } = render(<RichTextDisplay content="&lt;p&gt;Everything&lt;/p&gt;" />);
  expect(screen.getByText("Everything")).toBeInTheDocument();
  expect(container.textContent).not.toContain("<p>");
});

test("a plain-text description keeps its paragraphs, and unsafe HTML never runs", () => {
  const { container } = render(<RichTextDisplay content={"First line\nstill first\n\nSecond"} />);
  expect(container.querySelectorAll("p")).toHaveLength(2);
  expect(container.querySelectorAll("br")).toHaveLength(1);
  const img = render(<RichTextDisplay content={"Second <img src=x onerror=alert(1)>"} />);
  expect(img.container.querySelector("img")).toBeNull();
  const unsafe = render(<RichTextDisplay content={'&lt;p onclick="x()"&gt;Hi&lt;/p&gt;&lt;script&gt;alert(1)&lt;/script&gt;'} />);
  expect(unsafe.container.querySelector("script")).toBeNull();
  expect(unsafe.container.querySelector("[onclick]")).toBeNull();
});
