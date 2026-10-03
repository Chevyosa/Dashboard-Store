import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("is safe with no arguments", () => {
    expect(cn()).toBe("");
  });

  it("ignores falsy values", () => {
    expect(cn("a", undefined, null, false, "b")).toBe("a b");
  });
});
