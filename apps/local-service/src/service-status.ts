import { readFile, rename, writeFile } from "node:fs/promises";

type PersistedServiceMode = "starting" | "stopped";

export async function readPersistedServiceMode(statusFile: string): Promise<PersistedServiceMode> {
  try {
    const raw = await readFile(statusFile, "utf8");
    const parsed = JSON.parse(raw) as {
      snapshot?: {
        status?: string;
      };
    };

    return parsed.snapshot?.status === "stopped" ? "stopped" : "starting";
  } catch {
    await quarantineMalformedStatusFile(statusFile);
    return "starting";
  }
}

async function quarantineMalformedStatusFile(statusFile: string) {
  try {
    const raw = await readFile(statusFile, "utf8");
    const quarantinePath = `${statusFile}.corrupt-${Date.now()}`;

    try {
      await rename(statusFile, quarantinePath);
      await writeFile(
        `${quarantinePath}.note.txt`,
        "OpsProbe quarantined a malformed local-service status snapshot during automatic recovery.\n",
        "utf8",
      );
    } catch {
      await writeFile(quarantinePath, raw, "utf8");
    }
  } catch {
    // Missing status files are a normal first-run condition.
  }
}
