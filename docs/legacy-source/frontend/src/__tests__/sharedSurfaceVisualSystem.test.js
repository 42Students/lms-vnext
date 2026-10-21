import fs from "fs";
import path from "path";

const read = (name) => fs.readFileSync(path.join(process.cwd(), "src/styles/components", name), "utf8");

describe("shared surface visual defaults", () => {
  test("default cards use the canonical card radius and border token", () => {
    const cards = read("_cards.scss");
    expect(cards).toMatch(/border-radius:\s*\$radius-card;/);
    expect(cards).toMatch(/border-color:\s*\$border;/);
    expect(cards).toMatch(/box-shadow:\s*\$elev-1;/);
  });

  test("standard form controls share one height and control radius while preserving size variants", () => {
    const forms = read("_form-inputs.scss");
    expect(forms).toMatch(/min-height:\s*40px;/);
    expect(forms).toMatch(/border-radius:\s*\$radius-control/);
    expect(forms).toContain(":not(.ant-input-sm)");
    expect(forms).toContain(":not(.ant-select-sm)");
  });

  test("bare tables use the shared medium density tokens", () => {
    const tables = read("_tables.scss");
    expect(tables).toMatch(/padding:\s*\$space-3\s+\$space-4;/);
    expect(tables).toMatch(/font-size:\s*\$text-sm;/);
    expect(tables).toContain(":not(.ln-table)");
  });

  test("default buttons remain visually secondary to primary teal actions", () => {
    const buttons = read("_button.scss");
    expect(buttons).toMatch(/&\.ant-btn-default[\s\S]*?background:\s*\$white;/);
    expect(buttons).toMatch(/&\.ant-btn-default[\s\S]*?color:\s*\$neutral-700;/);
  });

  test("shared buttons and icon-only controls use the canonical control system", () => {
    const buttons = read("_button.scss");
    const icons = read("_icons.scss");
    expect(buttons).toMatch(/\.ln-btn\s*\{[\s\S]*?border-radius:\s*\$radius-control;/);
    expect(buttons).toMatch(/&--regular[\s\S]*?border-radius:\s*\$radius-control;/);
    expect(icons).toMatch(/\.ant-btn\.ant-btn-icon-only/);
    expect(icons).toMatch(/font-size:\s*\$text-md;/);
  });

  test("common empty and error states use semantic shared tokens", () => {
    const states = read("_panel-states.scss");
    expect(states).toMatch(/color:\s*\$status-error;/);
    expect(states).toMatch(/color:\s*\$neutral-900;/);
    expect(states).toMatch(/color:\s*\$neutral-500;/);
  });
});
