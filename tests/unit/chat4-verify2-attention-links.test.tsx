import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { SuperAdminDrivePipeline } from "@/components/placements/super-admin-drive-pipeline";

describe("W1 missing-letter attention includes hired learners", () => {
  it("uses the attention filter over ALL application stages instead of hiding HIRED records", () => {
    const service = readFileSync("src/modules/placements/super-admin-drive-attention-service.ts", "utf8");
    expect(service).toContain('stage:"ALL",filter:"OFFERED_NO_LETTER"');
    expect(service).toContain("o.status in ('ISSUED','ACCEPTED')");
    const html = renderToStaticMarkup(
      <SuperAdminDrivePipeline rows={null} jobId="job-123" attention={[{
        label:"Offered, no offer letter attached",stage:"ALL",
        filter:"OFFERED_NO_LETTER",count:3,details:"Issued or accepted offers missing a letter",
      }]} />,
    );
    expect(html).toContain("Needs attention (3)");
    expect(html).toContain("stage=ALL");
    expect(html).toContain("attention=OFFERED_NO_LETTER");
    expect(html).not.toContain("stage=OFFERED");
  });
});
