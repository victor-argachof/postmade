import type { ScheduledPublication } from "@postmade/types";
import { describe, expect, it } from "vitest";

import { publicationDisplayTitle } from "../publication-display";

const publication = (overrides: Partial<ScheduledPublication> = {}) =>
  ({ title: null, content: "Legenda", ...overrides }) as ScheduledPublication;

describe("publicationDisplayTitle", () => {
  it("prioritizes title, then content, then the media fallback", () => {
    expect(
      publicationDisplayTitle(publication({ title: "Campanha" }), "Mídia")
    ).toBe("Campanha");
    expect(publicationDisplayTitle(publication(), "Mídia")).toBe("Legenda");
    expect(publicationDisplayTitle(publication({ content: "" }), "Mídia")).toBe(
      "Mídia"
    );
  });
});
