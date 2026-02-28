import { generateSlug } from "@/lib/slug";

describe("generateSlug", () => {
  it("converts spaces to hyphens", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  it("lowercases the title", () => {
    expect(generateSlug("My Book Article")).toBe("my-book-article");
  });

  it("strips special characters", () => {
    expect(generateSlug("Hello, World!")).toBe("hello-world");
  });

  it("trims leading and trailing whitespace", () => {
    expect(generateSlug("  hello world  ")).toBe("hello-world");
  });

  it("handles multiple spaces", () => {
    expect(generateSlug("hello   world")).toBe("hello-world");
  });

  it("handles already slugged input", () => {
    expect(generateSlug("hello-world")).toBe("hello-world");
  });

  it("handles apostrophes and quotes", () => {
    const slug = generateSlug("Why I Wrote This Book");
    expect(slug).toBe("why-i-wrote-this-book");
  });

  it("returns a non-empty string for a non-empty input", () => {
    expect(generateSlug("Test")).not.toBe("");
  });
});
