import fs from "fs";
import path from "path";

const componentsDir = path.join(process.cwd(), "src", "styles", "components");
const portalFiles = fs.readdirSync(componentsDir)
  .filter((name) => /^_(tpo|recruiter)-.*\.scss$/.test(name))
  .map((name) => path.join(componentsDir, name));

const LEGACY_INTERACTION_BLUES = /#(?:1677ff|2f6fed|0958d9|bcd2fb|f0f5ff)\b/ig;

describe("TPO/recruiter brand-token regression", () => {
  test("portal styles do not reintroduce the legacy royal-blue interaction palette", () => {
    const offenders = [];
    portalFiles.forEach((file) => {
      const source = fs.readFileSync(file, "utf8");
      const matches = source.match(LEGACY_INTERACTION_BLUES);
      if (matches?.length) {
        offenders.push(`${path.basename(file)}: ${[...new Set(matches.map((v) => v.toLowerCase()))].join(", ")}`);
      }
    });

    expect(offenders).toEqual([]);
  });
});
