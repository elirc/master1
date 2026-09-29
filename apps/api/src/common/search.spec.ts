import { normalizeSearchTerm } from "./search";

describe("search helpers", () => {
  it("normalizes useful search terms", () => {
    expect(normalizeSearchTerm("  Ada   Lovelace ")).toBe("Ada Lovelace");
  });

  it("drops very short terms", () => {
    expect(normalizeSearchTerm("a")).toBeUndefined();
  });
});
