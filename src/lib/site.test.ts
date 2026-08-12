import { describe, expect, it } from "vitest";
import { siteConfig } from "./site";

describe("siteConfig", () => {
  it("uses the production GitHub Pages origin", () => {
    expect(new URL(siteConfig.url).origin).toBe("https://sunnypark87.github.io");
  });

  it("keeps the canonical brand name", () => {
    expect(siteConfig.name).toBe("Littlebread Lab");
  });
});
