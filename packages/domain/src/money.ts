export type CurrencyCode = "USD" | "CAD" | "GBP";

export interface Money {
  amountMinor: number;
  currency: CurrencyCode;
}

export function money(amountMinor: number, currency: CurrencyCode): Money {
  if (!Number.isInteger(amountMinor)) {
    throw new Error("Money amounts must be integer minor units.");
  }

  return { amountMinor, currency };
}

export function addMoney(items: Money[]): Money {
  if (items.length === 0) {
    return money(0, "USD");
  }

  const first = items[0];
  if (!first) {
    return money(0, "USD");
  }

  const rest = items.slice(1);
  const total = rest.reduce((sum, item) => {
    if (item.currency !== first.currency) {
      throw new Error("Cannot add money across currencies without an FX conversion.");
    }
    return sum + item.amountMinor;
  }, first.amountMinor);

  return money(total, first.currency);
}
