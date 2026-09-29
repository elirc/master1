import { pagedResponse, parsePagination } from "./pagination";

describe("pagination helpers", () => {
  it("normalizes invalid input to defaults", () => {
    expect(parsePagination({ page: "nope", pageSize: "-1" })).toEqual({
      page: 1,
      pageSize: 25,
      skip: 0,
      take: 25
    });
  });

  it("calculates offsets and caps page size", () => {
    expect(parsePagination({ page: "3", pageSize: "500" })).toEqual({
      page: 3,
      pageSize: 100,
      skip: 200,
      take: 100
    });
  });

  it("wraps data with metadata", () => {
    expect(pagedResponse(["a"], 51, { page: 2, pageSize: 25, skip: 25, take: 25 })).toEqual({
      data: ["a"],
      meta: {
        page: 2,
        pageSize: 25,
        total: 51,
        pageCount: 3
      }
    });
  });
});
