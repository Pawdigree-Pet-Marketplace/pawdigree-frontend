import { describe, expect, it } from "vitest";
import { countWords, formatAge, paramsToQuery } from "./petUtils";

describe("formatAge", () => {
  it("labels ages in months as old, including singular month", () => {
    expect(formatAge(1)).toBe("1 month old");
    expect(formatAge(5)).toBe("5 months old");
  });

  it("labels ages in years and preserves remaining months", () => {
    expect(formatAge(12)).toBe("1 year old");
    expect(formatAge(26)).toBe("2 years 2 months old");
  });
});

describe("countWords", () => {
  it("treats blank descriptions as optional and counts whitespace separated words", () => {
    expect(countWords("  \n ")).toBe(0);
    expect(countWords("one   two\nthree")).toBe(3);
  });
});

describe("paramsToQuery", () => {
  it("accepts the adoption filter in route-normalized lowercase URLs", () => {
    expect(paramsToQuery("?listing_type=adoption").listingType).toBe("ADOPTION");
  });
});
