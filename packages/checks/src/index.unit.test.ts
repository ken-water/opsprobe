import { describe, expect, it } from "vitest";
import { findBuiltInTemplateDefinition, resolveTemplateChecks } from "./index";

describe("built-in check definitions", () => {
  it("includes deeper Kubernetes workflow checks in the kubernetes template", () => {
    const template = findBuiltInTemplateDefinition("template.linux.kubernetes");

    expect(template).toBeDefined();
    expect(template?.checkIds).toContain("linux.kubernetes.node.summary");
    expect(template?.checkIds).toContain("linux.kubernetes.static-pod.inventory");
    expect(template?.checkIds).toContain("linux.kubelet.health.summary");
    expect(template?.checkIds).toContain("linux.kubernetes.node.pressure");
  });

  it("resolves Kubernetes node depth checks", () => {
    const checks = resolveTemplateChecks("template.linux.kubernetes");
    const ids = checks.map((check) => check.id);

    expect(ids).toContain("linux.kubernetes.node.summary");
    expect(ids).toContain("linux.kubernetes.static-pod.inventory");
    expect(ids).toContain("linux.kubelet.health.summary");
    expect(ids).toContain("linux.kubernetes.node.pressure");
  });

  it("includes deeper Docker workflow checks in the docker template", () => {
    const template = findBuiltInTemplateDefinition("template.linux.docker");

    expect(template).toBeDefined();
    expect(template?.checkIds).toContain("linux.docker.runtime.summary");
    expect(template?.checkIds).toContain("linux.docker.image.inventory");
  });

  it("resolves Docker runtime and image inventory checks", () => {
    const checks = resolveTemplateChecks("template.linux.docker");
    const ids = checks.map((check) => check.id);

    expect(ids).toContain("linux.docker.runtime.summary");
    expect(ids).toContain("linux.docker.image.inventory");
  });

  it("includes deeper Redis workflow checks in the redis template", () => {
    const template = findBuiltInTemplateDefinition("template.linux.redis");

    expect(template).toBeDefined();
    expect(template?.checkIds).toContain("linux.redis.runtime.info");
    expect(template?.checkIds).toContain("linux.redis.replication.info");
    expect(template?.checkIds).toContain("linux.redis.memory.pressure");
    expect(template?.checkIds).toContain("linux.redis.persistence.risk");
    expect(template?.checkIds).toContain("linux.redis.blocking.risk");
  });

  it("resolves Redis runtime and replication checks", () => {
    const checks = resolveTemplateChecks("template.linux.redis");
    const ids = checks.map((check) => check.id);

    expect(ids).toContain("linux.redis.runtime.info");
    expect(ids).toContain("linux.redis.replication.info");
    expect(ids).toContain("linux.redis.memory.pressure");
    expect(ids).toContain("linux.redis.persistence.risk");
    expect(ids).toContain("linux.redis.blocking.risk");
  });

  it("includes deeper MySQL workflow checks in the mysql template", () => {
    const template = findBuiltInTemplateDefinition("template.linux.mysql");

    expect(template).toBeDefined();
    expect(template?.checkIds).toContain("linux.mysql.runtime.info");
    expect(template?.checkIds).toContain("linux.mysql.schema.inventory");
    expect(template?.checkIds).toContain("linux.mysql.connection.pressure");
    expect(template?.checkIds).toContain("linux.mysql.replication.hints");
    expect(template?.checkIds).toContain("linux.mysql.slow-query.risk");
    expect(template?.checkIds).toContain("linux.mysql.temp-disk-table.risk");
  });

  it("resolves MySQL runtime and schema inventory checks", () => {
    const checks = resolveTemplateChecks("template.linux.mysql");
    const ids = checks.map((check) => check.id);

    expect(ids).toContain("linux.mysql.runtime.info");
    expect(ids).toContain("linux.mysql.schema.inventory");
    expect(ids).toContain("linux.mysql.connection.pressure");
    expect(ids).toContain("linux.mysql.replication.hints");
    expect(ids).toContain("linux.mysql.slow-query.risk");
    expect(ids).toContain("linux.mysql.temp-disk-table.risk");
  });
});
