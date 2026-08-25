import { describe, expect, it } from "vitest";
import {
  getSubdomainFromHost,
  isCustomDomainHost,
  isReservedSubdomain,
  isValidSubdomain,
  schemaNameForSubdomain,
  slugifySubdomain,
} from "@/lib/tenant/subdomain";

describe("slugifySubdomain", () => {
  it("lowercases, hyphenates, and trims", () => {
    expect(slugifySubdomain("My Awesome Shop")).toBe("my-awesome-shop");
    expect(slugifySubdomain("  Café & Co!! ")).toBe("cafe-co");
    expect(slugifySubdomain("---a---")).toBe("a");
  });
});

describe("isValidSubdomain", () => {
  it("accepts 3-40 char lowercase alphanumerics with single hyphens", () => {
    expect(isValidSubdomain("myshop")).toBe(true);
    expect(isValidSubdomain("my-shop-1")).toBe(true);
  });
  it("rejects invalid shapes", () => {
    for (const bad of ["ab", "-shop", "shop-", "My-Shop", "a_b", "sh op"]) {
      expect(isValidSubdomain(bad)).toBe(false);
    }
  });
});

describe("isReservedSubdomain", () => {
  it("flags platform-reserved names", () => {
    expect(isReservedSubdomain("www")).toBe(true);
    expect(isReservedSubdomain("admin")).toBe(true);
    expect(isReservedSubdomain("myshop")).toBe(false);
  });
});

describe("schemaNameForSubdomain", () => {
  it("maps hyphens to underscores with a tenant_ prefix", () => {
    expect(schemaNameForSubdomain("my-shop")).toBe("tenant_my_shop");
  });
});

describe("getSubdomainFromHost", () => {
  const root = "localhost:3000";
  it("extracts a tenant subdomain", () => {
    expect(getSubdomainFromHost("shop.localhost:3000", root)).toBe("shop");
    expect(getSubdomainFromHost("SHOP.localhost:3000", root)).toBe("shop");
  });
  it("returns null for the platform / reserved / custom domains", () => {
    expect(getSubdomainFromHost("localhost:3000", root)).toBeNull();
    expect(getSubdomainFromHost("www.localhost:3000", root)).toBeNull();
    expect(getSubdomainFromHost("api.localhost:3000", root)).toBeNull();
    expect(getSubdomainFromHost("example.com", root)).toBeNull();
    expect(getSubdomainFromHost(null, root)).toBeNull();
  });
});

describe("isCustomDomainHost", () => {
  const root = "localhost:3000";
  it("detects custom domains", () => {
    expect(isCustomDomainHost("shop.example.com", root)).toBe(true);
    expect(isCustomDomainHost("example.com", root)).toBe(true);
  });
  it("is false for platform, subdomain, and bare hosts", () => {
    expect(isCustomDomainHost("localhost:3000", root)).toBe(false);
    expect(isCustomDomainHost("shop.localhost:3000", root)).toBe(false);
    expect(isCustomDomainHost("www.localhost:3000", root)).toBe(false);
    expect(isCustomDomainHost("localhost", root)).toBe(false);
    expect(isCustomDomainHost(null, root)).toBe(false);
  });
});
