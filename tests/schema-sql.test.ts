import { describe, expect, it } from "vitest";
import {
  assertValidSchemaName,
  tenantSchemaStatements,
} from "@/lib/tenant/schema-sql";

describe("assertValidSchemaName (SQL-injection guard)", () => {
  it("accepts valid tenant schema names", () => {
    expect(() => assertValidSchemaName("tenant_shop")).not.toThrow();
    expect(() => assertValidSchemaName("tenant_my_shop_2")).not.toThrow();
  });

  it("rejects anything not matching tenant_[a-z0-9_]+", () => {
    for (const bad of [
      "public",
      "tenant-shop",
      "Tenant_Shop",
      "tenant_",
      "tenant_shop; DROP TABLE users",
      'tenant_"shop"',
      "tenant_shop--",
      "tenant shop",
      "",
    ]) {
      expect(() => assertValidSchemaName(bad)).toThrow();
    }
  });

  it("rejects names longer than 63 chars", () => {
    expect(() => assertValidSchemaName(`tenant_${"a".repeat(60)}`)).toThrow();
  });
});

describe("tenantSchemaStatements", () => {
  it("creates the schema and the core tenant tables", () => {
    const stmts = tenantSchemaStatements("tenant_shop");
    const joined = stmts.join("\n");
    expect(joined).toContain('CREATE SCHEMA IF NOT EXISTS "tenant_shop"');
    for (const table of [
      "site_config",
      "products",
      "orders",
      "inventory",
      "customers",
    ]) {
      expect(joined).toContain(`"tenant_shop"."${table}"`);
    }
  });

  it("throws for an invalid schema name (never interpolates unsafely)", () => {
    expect(() => tenantSchemaStatements('tenant_"; DROP')).toThrow();
  });
});
