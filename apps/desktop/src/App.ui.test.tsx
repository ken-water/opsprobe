import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(async (command: string) => {
    switch (command) {
      case "get_local_service_settings":
        return { settings: {} };
      case "get_local_service_status":
        return {
          ok: true,
          snapshot: {
            status: "ready",
            config: {
              postgres: { port: 15432 },
              paths: {
                reportDir: "/tmp/opsprobe-reports",
                postgresDataDir: "/tmp/opsprobe-pg/data",
                postgresLogDir: "/tmp/opsprobe-pg/log",
              },
            },
            health: {
              runtime: null,
              checks: [
                {
                  id: "service.process",
                  label: "Managed Service Process",
                  status: "pass",
                  detail: "The local service background process is running.",
                },
                {
                  id: "local.report_dir",
                  label: "Report Directory",
                  status: "pass",
                  detail: "Report export directory is writable.",
                },
              ],
            },
            recoveryActions: [],
          },
        };
      case "get_local_service_assets":
        return { assets: [] };
      case "get_local_service_schedules":
        return { schedules: [] };
      case "get_local_service_inspection_history":
        return { runs: [] };
      case "upsert_local_service_settings":
        return { ok: true };
      default:
        return {};
    }
  }),
}));

vi.mock("./tauri-client", () => ({
  invokeDesktop: invokeMock,
}));

vi.mock("./pdf", () => ({
  exportRunPdfReport: vi.fn(),
}));

function getNavButton(nav: HTMLElement, label: string) {
  const button = within(nav)
    .getAllByRole("button")
    .find((element) => element.textContent?.trim() === label);

  if (!button) {
    throw new Error(`Navigation button "${label}" was not found.`);
  }

  return button;
}

describe("desktop app shell", () => {
  beforeEach(() => {
    invokeMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps sidebar navigation concise and free from content copy", async () => {
    render(<App />);

    const nav = await screen.findByRole("navigation", { name: "Primary" });

    await waitFor(() => {
      expect(getNavButton(nav, "Overview")).toBeTruthy();
    });

    expect(within(nav).queryByText("Current posture and first-run progress.")).toBeNull();
    expect(within(nav).queryByText("Local-first inspection workspace for operators, not a browser landing page.")).toBeNull();
  });

  it("switches workspaces when a navigation item is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = await screen.findByRole("navigation", { name: "Primary" });

    await waitFor(() => {
      expect(getNavButton(nav, "Runner")).toBeTruthy();
    });

    await user.click(getNavButton(nav, "Runner"));

    await waitFor(() => {
      expect(screen.getAllByRole("heading").some((heading) => heading.textContent?.trim() === "Inspection Runner")).toBe(true);
    });

    expect(screen.getByText("Workspace Update")).toBeTruthy();
  });

  it("shows an explicit demo-mode button state in setup workspace", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = await screen.findByRole("navigation", { name: "Primary" });

    await waitFor(() => {
      expect(getNavButton(nav, "Setup")).toBeTruthy();
    });

    await user.click(getNavButton(nav, "Setup"));

    await waitFor(() => {
      expect(screen.getAllByRole("heading").some((heading) => heading.textContent?.trim() === "First-Run Setup")).toBe(true);
    });

    expect(screen.getByRole("button", { name: "Demo Data Loaded" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Switch to Real Setup" })).toBeTruthy();
  });
});
