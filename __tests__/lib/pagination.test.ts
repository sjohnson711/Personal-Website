import {
  getPaginationParams,
  getTotalPages,
  ARTICLES_PER_PAGE,
} from "@/lib/pagination";

describe("ARTICLES_PER_PAGE", () => {
  it("is 7", () => {
    expect(ARTICLES_PER_PAGE).toBe(7);
  });
});

describe("getPaginationParams", () => {
  it("returns page 1 with skip 0 by default", () => {
    const result = getPaginationParams({});
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
    expect(result.take).toBe(7);
  });

  it("returns correct skip for page 2", () => {
    const result = getPaginationParams({ page: "2" });
    expect(result.page).toBe(2);
    expect(result.skip).toBe(7);
    expect(result.take).toBe(7);
  });

  it("returns correct skip for page 3", () => {
    const result = getPaginationParams({ page: "3" });
    expect(result.page).toBe(3);
    expect(result.skip).toBe(14);
  });

  it("clamps page to 1 for invalid input", () => {
    expect(getPaginationParams({ page: "0" }).page).toBe(1);
    expect(getPaginationParams({ page: "-5" }).page).toBe(1);
    expect(getPaginationParams({ page: "abc" }).page).toBe(1);
  });

  it("handles missing page param", () => {
    const result = getPaginationParams({ page: undefined });
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });
});

describe("getTotalPages", () => {
  it("returns 1 page for 0 articles", () => {
    expect(getTotalPages(0)).toBe(0);
  });

  it("returns 1 page for 7 articles", () => {
    expect(getTotalPages(7)).toBe(1);
  });

  it("returns 2 pages for 8 articles", () => {
    expect(getTotalPages(8)).toBe(2);
  });

  it("returns 2 pages for 14 articles", () => {
    expect(getTotalPages(14)).toBe(2);
  });

  it("returns 3 pages for 15 articles", () => {
    expect(getTotalPages(15)).toBe(3);
  });

  it("returns correct ceiling for non-multiples of 7", () => {
    expect(getTotalPages(1)).toBe(1);
    expect(getTotalPages(6)).toBe(1);
    expect(getTotalPages(13)).toBe(2);
    expect(getTotalPages(21)).toBe(3);
  });
});
