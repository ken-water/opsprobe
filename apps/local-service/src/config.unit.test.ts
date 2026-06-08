import { afterEach, describe, expect, it } from "vitest";
import { createDefaultLocalServiceConfig } from "./config";

const originalHome = process.env.HOME;
const originalPort = process.env.OPSPROBE_POSTGRES_PORT;

afterEach(() => {
  if (originalHome === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = originalHome;
  }

  if (originalPort === undefined) {
    delete process.env.OPSPROBE_POSTGRES_PORT;
  } else {
    process.env.OPSPROBE_POSTGRES_PORT = originalPort;
  }
});

describe("createDefaultLocalServiceConfig", () => {
  it("uses the default managed PostgreSQL port when no override is present", () => {
    delete process.env.OPSPROBE_POSTGRES_PORT;

    const config = createDefaultLocalServiceConfig();

    expect(config.postgres.port).toBe(15432);
  });

  it("accepts a managed PostgreSQL port override from the environment", () => {
    process.env.OPSPROBE_POSTGRES_PORT = "16432";

    const config = createDefaultLocalServiceConfig();

    expect(config.postgres.port).toBe(16432);
  });

  it("falls back to the default port when the override is invalid", () => {
    process.env.OPSPROBE_POSTGRES_PORT = "invalid";

    const config = createDefaultLocalServiceConfig();

    expect(config.postgres.port).toBe(15432);
  });
});
