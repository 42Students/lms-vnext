import {describe,expect,it} from "vitest";
import {legacyDriveStatusActionSchema,PUBLISH_ENTRY_COPY} from "@/modules/placements/tpo-drive-publish-entry-model";
describe("TPO-drives-R01 TPO-drives-R02 publish entry gate",()=>{
  it("does not allow unconfirmed direct publishing",()=>{
    expect(legacyDriveStatusActionSchema.safeParse({action:"PUBLISH"}).success).toBe(false);
    expect(legacyDriveStatusActionSchema.safeParse({action:"CLOSE"}).success).toBe(true);
    expect(legacyDriveStatusActionSchema.safeParse({action:"CLOSE",confirmed:true}).success).toBe(false);
  });
  it("keeps create in draft until a workspace review",()=>{
    expect(PUBLISH_ENTRY_COPY.review).toBe("Review the drive and confirm who is told before publishing.");
    expect(PUBLISH_ENTRY_COPY.draft).toBe("Create draft");
  });
});
