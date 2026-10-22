import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("G2-17-23-077 offer response cascade workload", () => {
  const source=readFileSync("src/modules/placements/offer-service.ts","utf8");
  const response=source.slice(source.indexOf("export async function actOnPlacementOffer("));

  it("locks sibling offers and applications in stable ID order and batches the cascade", () => {
    expect(response).toContain("orderBy(asc(placementOffers.id)).for(\"update\")");
    expect(response).toContain("orderBy(asc(placementApplications.id)).for(\"update\")");
    expect(response).toContain("inArray(placementOffers.id,declinedOffers.map(row=>row.id))");
    expect(response).toContain("declined.length!==declinedOffers.length");
    expect(response).toContain("await tx.insert(placementOfferStatusHistory).values(\n          declined.map");
    expect(response).not.toContain("for(const other of declinedOffers)");
  });

  it("uses one serializable transaction with atomic application and offer histories", () => {
    expect(response).toContain("return db.transaction(async (tx) => {");
    expect(response).toContain('isolationLevel: "serializable"');
    expect(response).toContain("tx.insert(placementApplicationStatusHistory).values(");
    expect(response).toContain("tx.insert(placementOfferStatusHistory).values(");
  });
});
