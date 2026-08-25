import { describe, expect, it } from "vitest";
import { formatTaka } from "@/lib/format";

describe("formatTaka", () => {
  it("formats with the Taka sign and thousands separators", () => {
    expect(formatTaka(2500)).toBe("৳2,500");
    expect(formatTaka(0)).toBe("৳0");
    expect(formatTaka(1234567)).toBe("৳1,234,567");
  });
});
