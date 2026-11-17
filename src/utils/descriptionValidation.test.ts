import { describe, expect, it } from "vitest";
import {
  getDescriptionErrorFromMessage,
  getListingDescriptionError,
  limitListingDescriptionWords,
  MAX_LISTING_DESCRIPTION_CHARACTERS,
  MAX_LISTING_DESCRIPTION_WORDS,
} from "./descriptionValidation";

describe("listing description validation", () => {
  it("accepts exactly 300 words and 3,000 characters", () => {
    expect(getListingDescriptionError(Array(MAX_LISTING_DESCRIPTION_WORDS).fill("word").join(" "))).toBeNull();
    // Create a boundary string with exactly 300 whitespace-delimited words.
    const exact = `${Array(299).fill("word").join(" ")} ${"x".repeat(1505)}`;
    expect(exact).toHaveLength(MAX_LISTING_DESCRIPTION_CHARACTERS);
    expect(getListingDescriptionError(exact)).toBeNull();
  });

  it("rejects more than 300 words", () => {
    expect(getListingDescriptionError(Array(301).fill("word").join(" ")))
      .toBe("Description must be 300 words or fewer (you wrote 301).");
  });

  it("trims typing and pasted text to 300 words", () => {
    const overLimit = Array(360).fill("word").join(" ");
    const limited = limitListingDescriptionWords(overLimit);
    expect(limited.split(/\s+/)).toHaveLength(MAX_LISTING_DESCRIPTION_WORDS);
    expect(getListingDescriptionError(limited)).toBeNull();
  });

  it("rejects more than 3,000 characters", () => {
    expect(getListingDescriptionError("x".repeat(3001)))
      .toBe("Description must be 3,000 characters or fewer (you wrote 3001).");
  });

  it("extracts the backend description field error", () => {
    expect(getDescriptionErrorFromMessage("name: Invalid\ndescription: Description must be 300 words or fewer (you wrote 312)."))
      .toBe("Description must be 300 words or fewer (you wrote 312).");
  });
});
