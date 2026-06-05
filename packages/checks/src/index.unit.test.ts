import { describe, expect, it } from "vitest";
import { findBuiltInTemplateDefinition, resolveTemplateChecks } from "./index";

describe("built-in check definitions", () => {
  it("includes deeper Redis workflow checks in the redis template", () => {
    const template = findBuiltInTemplateDefinition("template.linux.redis");

    expect(template).toBeDefined();
    expect(template?.checkIds).toContain("linux.redis.runtime.info");
    expect(template?.checkIds).toContain("linux.redis.replication.info");
  });

  it("resolves Redis runtime and replication checks", () => {
    const checks = resolveTemplateChecks("template.linux.redis");
    const ids = checks.map((check) => check.id);

    expect(ids).toContain("linux.redis.runtime.info");
    expect(ids).toContain("linux.redis.replication.info");
  });

  it("includes deeper MySQL workflow checks in the mysql template", () => {
    const template = findBuiltInTemplateDefinition("template.linux.mysql");

    expect(template).toBeDefined();
    expect(template?.checkIds).toContain("linux.mysql.runtime.info");
    expect(template?.checkIds).toContain("linux.mysql.schema.inventory");
  });

  it("resolves MySQL runtime and schema inventory checks", () => {
    const checks = resolveTemplateChecks("template.linux.mysql");
    const ids = checks.map((check) => check.id);

    expect(ids).toContain("linux.mysql.runtime.info");
    expect(ids).toContain("linux.mysql.schema.inventory");
  });
});
