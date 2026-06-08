type TauriInvokeArgs = Record<string, unknown> | undefined;

type TauriInvokeLike = <TResponse>(
  command: string,
  args?: TauriInvokeArgs,
) => Promise<TResponse>;

declare global {
  interface Window {
    __OPS_PROBE_DESKTOP__?: {
      invoke?: TauriInvokeLike;
    };
  }
}

async function loadTauriInvoke(): Promise<TauriInvokeLike> {
  if (typeof window !== "undefined") {
    const mockInvoke = window.__OPS_PROBE_DESKTOP__?.invoke;
    if (typeof mockInvoke === "function") {
      return mockInvoke;
    }
  }

  const module = await import("@tauri-apps/api/core");
  return module.invoke as TauriInvokeLike;
}

export async function invokeDesktop<TResponse>(
  command: string,
  args?: TauriInvokeArgs,
) {
  const invoke = await loadTauriInvoke();
  return invoke<TResponse>(command, args);
}
