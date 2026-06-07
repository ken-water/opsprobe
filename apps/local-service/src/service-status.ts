import { readFile } from "node:fs/promises";

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
    return "starting";
  }
}
