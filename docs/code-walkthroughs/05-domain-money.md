# 05 - Money Helpers

Source: `packages/domain/src/money.ts`

## Why This File Matters

Money is one of the easiest places to create subtle bugs. This file is small, but it encodes two serious habits: store money in integer minor units and never add different currencies without an explicit conversion.

## Line-By-Line Reading Notes

Line 1 defines supported currency codes.

Lines 3-6 define the `Money` interface. `amountMinor` means cents, pence, or the smallest normal unit of that currency. For example, 650000 GBP minor units means GBP 6,500.00.

Lines 8-14 define the `money()` constructor helper.

Lines 9-11 reject non-integer amounts. This protects the system from accidentally storing floating-point values like `19.99`, which can create rounding errors.

Line 13 returns a valid `Money` object.

Lines 16-33 define `addMoney()`.

Lines 17-19 return zero USD for an empty list. This is a pragmatic default, but it is worth noticing. In a more mature system, an empty sum might require an explicit currency argument.

Lines 21-24 grab the first item defensively. Because the TypeScript config enables `noUncheckedIndexedAccess`, `items[0]` could technically be undefined even after a length check. The code handles that explicitly.

Line 26 slices the remaining items.

Lines 27-31 reduce the rest of the list into a total. Before adding each item, the function checks that the currency matches the first item.

Line 32 returns the total in the original currency.

## Codebase Connections

- Payroll and invoice code currently store raw minor-unit integers in the database.
- These helpers are tested by `packages/domain/src/payroll.test.ts`.
- Future payroll calculators should use these helpers or a richer money library.

## Senior-Level Questions

- Should empty sums default to USD? Maybe not long term.
- Where should FX conversion live?
- Should database currency columns be constrained to known currency codes?
