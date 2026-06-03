import { StubLocalServiceBootstrap } from "./index.ts";
import type { LocalServiceStatusResponse } from "./index.ts";

async function main() {
  const bootstrap = new StubLocalServiceBootstrap();
  const health = await bootstrap.ensureRuntime();

  const response: LocalServiceStatusResponse = {
    ok: true,
    snapshot: {
      status: health.status,
      config: bootstrap.config,
      health,
    },
  };

  process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown local service failure.";

  process.stderr.write(
    `${JSON.stringify(
      {
        ok: false,
        error: message,
      },
      null,
      2,
    )}\n`,
  );
  process.exitCode = 1;
});
