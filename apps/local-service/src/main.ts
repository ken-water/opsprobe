import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { StubLocalServiceBootstrap } from "./index.ts";
import type {
  LocalServiceCommandResponse,
  LocalServiceStatusResponse,
} from "./index.ts";

const bootstrap = new StubLocalServiceBootstrap();
const config = bootstrap.config;

async function ensureRuntimeDirs() {
  await Promise.all([
    mkdir(config.paths.rootDir, { recursive: true }),
    mkdir(config.paths.configDir, { recursive: true }),
    mkdir(config.paths.dataDir, { recursive: true }),
    mkdir(config.paths.logDir, { recursive: true }),
    mkdir(config.paths.runtimeDir, { recursive: true }),
    mkdir(config.paths.postgresDataDir, { recursive: true }),
    mkdir(config.paths.postgresLogDir, { recursive: true }),
  ]);
}

async function buildStatusResponse(
  mode: "starting" | "ready" | "stopped" = "starting",
): Promise<LocalServiceStatusResponse> {
  const health = await bootstrap.ensureRuntime();

  return {
    ok: true,
    snapshot: {
      status: mode === "ready" ? "ready" : mode === "stopped" ? "stopped" : health.status,
      config,
      health: {
        ...health,
        status: mode === "ready" ? "ready" : mode === "stopped" ? "stopped" : health.status,
        checks:
          mode === "ready"
            ? health.checks.map((check) =>
                check.id === "service.process"
                  ? {
                      ...check,
                      status: "pass",
                      detail: "The local service background process is running.",
                    }
                  : check,
              )
            : health.checks,
      },
    },
  };
}

async function writeStatusFile(mode: "starting" | "ready" | "stopped") {
  const response = await buildStatusResponse(mode);
  await writeFile(
    config.paths.serviceStatusFile,
    `${JSON.stringify(response, null, 2)}\n`,
    "utf8",
  );
  return response;
}

async function readStatusFile(): Promise<LocalServiceStatusResponse | null> {
  if (!existsSync(config.paths.serviceStatusFile)) {
    return null;
  }

  const raw = await readFile(config.paths.serviceStatusFile, "utf8");
  return JSON.parse(raw) as LocalServiceStatusResponse;
}

async function statusCommand() {
  await ensureRuntimeDirs();
  const existing = await readStatusFile();
  const response = existing ?? (await buildStatusResponse("starting"));
  process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
}

async function stopCommand() {
  if (!existsSync(config.paths.servicePidFile)) {
    const response: LocalServiceCommandResponse = {
      ok: true,
      message: "Local service is already stopped.",
    };
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
    return;
  }

  const pid = Number((await readFile(config.paths.servicePidFile, "utf8")).trim());
  if (!Number.isNaN(pid)) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // Ignore missing process and still clean up runtime markers.
    }
  }

  await writeStatusFile("stopped");
  await rm(config.paths.servicePidFile, { force: true });

  const response: LocalServiceCommandResponse = {
    ok: true,
    message: "Local service stop signal sent.",
  };
  process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
}

async function serveCommand() {
  await ensureRuntimeDirs();
  await writeFile(config.paths.servicePidFile, `${process.pid}\n`, "utf8");
  await writeStatusFile("ready");

  const cleanup = async () => {
    await writeStatusFile("stopped");
    await rm(config.paths.servicePidFile, { force: true });
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void cleanup();
  });
  process.on("SIGTERM", () => {
    void cleanup();
  });

  setInterval(() => {
    void writeStatusFile("ready");
  }, 5000);
}

async function main() {
  const mode = process.argv[2] ?? "status";

  if (mode === "serve") {
    await serveCommand();
    return;
  }

  if (mode === "stop") {
    await stopCommand();
    return;
  }

  await statusCommand();
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
