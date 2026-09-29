import { describe, expect, it } from "vitest";
import { addMoney, money } from "./money";

describe("money helpers", () => {
  it("adds same-currency minor-unit values", () => {
    expect(addMoney([money(1000, "GBP"), money(250, "GBP")])).toEqual({
      amountMinor: 1250,
      currency: "GBP"
    });
  });

  it("rejects cross-currency addition", () => {
    expect(() => addMoney([money(1000, "GBP"), money(250, "USD")])).toThrow("FX conversion");
  });
});
