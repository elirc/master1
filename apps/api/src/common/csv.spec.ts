import { parseCsv, toCsv } from "./csv";

describe("csv helpers", () => {
  it("parses rows by header", () => {
    expect(parseCsv("name,email\nAda,ada@example.com")).toEqual([
      { name: "Ada", email: "ada@example.com" }
    ]);
  });

  it("escapes comma values when serializing", () => {
    expect(toCsv([{ name: "Ada, Lovelace", email: "ada@example.com" }])).toBe(
      'name,email\n"Ada, Lovelace",ada@example.com'
    );
  });
});
