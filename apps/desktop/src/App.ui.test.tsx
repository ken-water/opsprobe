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
      expect(getNavButton(nav, "Start")).toBeTruthy();
    });

    expect(within(nav).queryByText("Current posture and first-run progress.")).toBeNull();
    expect(within(nav).queryByText("Local-first inspection workspace for operators, not a browser landing page.")).toBeNull();
  });

  it("switches workspaces when a navigation item is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = await screen.findByRole("navigation", { name: "Primary" });

    await waitFor(() => {
      expect(getNavButton(nav, "Inspect")).toBeTruthy();
    });

    await user.click(getNavButton(nav, "Inspect"));

    await waitFor(() => {
      expect(screen.getAllByRole("heading").some((heading) => heading.textContent?.trim() === "Run An Inspection")).toBe(true);
    });

    expect(screen.getByText("Workspace Update")).toBeTruthy();
  });

  it("shows an explicit demo-mode button state in setup workspace", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = await screen.findByRole("navigation", { name: "Primary" });

    await waitFor(() => {
      expect(getNavButton(nav, "System")).toBeTruthy();
    });

    await user.click(getNavButton(nav, "System"));

    await waitFor(() => {
      expect(screen.getAllByRole("heading").some((heading) => heading.textContent?.trim() === "Readiness Summary")).toBe(true);
    });

    expect(screen.getByText("Demo mode is active")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Switch to Real Setup" }).length).toBeGreaterThan(0);
  });

  it("keeps inspect workflow focused by showing one section at a time", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = await screen.findByRole("navigation", { name: "Primary" });

    await waitFor(() => {
      expect(getNavButton(nav, "Inspect")).toBeTruthy();
    });

    await user.click(getNavButton(nav, "Inspect"));

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Run first inspection/i }).getAttribute("aria-selected")).toBe("true");
    });

    expect(screen.getByText("Run An Inspection")).toBeTruthy();
    expect(screen.queryByText("Save For Reuse")).toBeNull();
    expect(screen.queryByText("Automate Later")).toBeNull();

    await user.click(screen.getByRole("tab", { name: /Save target/i }));

    await waitFor(() => {
      expect(screen.getByText("Save For Reuse")).toBeTruthy();
    });

    expect(screen.queryByText("Run An Inspection")).toBeNull();
  });

  it("shows results as a current conclusion first and history second", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = await screen.findByRole("navigation", { name: "Primary" });

    await waitFor(() => {
      expect(getNavButton(nav, "Reports")).toBeTruthy();
    });

    await user.click(getNavButton(nav, "Reports"));

    await waitFor(() => {
      expect(screen.getAllByRole("heading").some((heading) => heading.textContent?.trim() === "Current Result")).toBe(true);
    });

    expect(screen.getAllByRole("heading").some((heading) => heading.textContent?.trim() === "History And Comparison")).toBe(true);
    expect(screen.getByText("Current Conclusion")).toBeTruthy();
    expect(screen.getByText("Result Snapshot")).toBeTruthy();
  });
});
