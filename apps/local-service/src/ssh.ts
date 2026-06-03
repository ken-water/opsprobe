import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { CheckResult, CheckDefinition } from "@opsprobe/checks";
import type { Asset } from "@opsprobe/core";
import type { RunnerAdapter, SshConnectionTestResult } from "@opsprobe/runner";

const execFileAsync = promisify(execFile);

interface SshExecutionOutput {
  stdout: string;
  stderr: string;
  ok: boolean;
}

interface SshCheckInput {
  asset: Asset;
  check: CheckDefinition;
}

function validateSshAsset(asset: Asset) {
  if (asset.host.trim().length === 0) {
    throw new Error("Host is required.");
  }

  if (asset.credential.username.trim().length === 0) {
    throw new Error("Username is required.");
  }

  if (asset.credential.secretRef.trim().length === 0) {
    throw new Error(
      asset.credential.method === "private-key"
        ? "Private key path is required for private-key authentication."
        : "Password is required for password authentication.",
    );
  }
}

async function runProcess(command: string, args: string[]): Promise<SshExecutionOutput> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    });

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      ok: true,
    };
  } catch (error) {
    const failure = error as {
      stdout?: string;
      stderr?: string;
      code?: number | string;
      message?: string;
    };

    return {
      stdout: (failure.stdout ?? "").trim(),
      stderr: (failure.stderr ?? failure.message ?? "").trim(),
      ok: false,
    };
  }
}

async function runSshCommand(asset: Asset, remoteCommand: string): Promise<SshExecutionOutput> {
  validateSshAsset(asset);

  const target = `${asset.credential.username}@${asset.host}`;
  const args = [
    "-o",
    "StrictHostKeyChecking=no",
    "-o",
    "ConnectTimeout=5",
    "-p",
    String(asset.port),
  ];

  if (asset.credential.method === "private-key") {
    args.push("-o", "BatchMode=yes", "-i", asset.credential.secretRef);
    return runProcess("ssh", [...args, target, remoteCommand]);
  }

  const sshpassCheck = await runProcess("sshpass", ["-V"]);
  if (!sshpassCheck.ok) {
    throw new Error("Password mode requires sshpass to be installed on the local machine.");
  }

  args.push("-o", "PreferredAuthentications=password", "-o", "PubkeyAuthentication=no");
  return runProcess("sshpass", ["-p", asset.credential.secretRef, "ssh", ...args, target, remoteCommand]);
}

async function sshOutput(asset: Asset, remoteCommand: string, checkId: string): Promise<string> {
  const output = await runSshCommand(asset, remoteCommand);
  if (output.ok) {
    if (output.stdout.length === 0) {
      throw new Error("Remote command returned empty output.");
    }
    return output.stdout;
  }

  throw new Error(output.stderr || `SSH command failed for ${checkId}.`);
}

function normalizedResult(
  input: SshCheckInput,
  status: CheckResult["status"],
  severity: CheckResult["severity"],
  summary: string,
  evidence: CheckResult["evidence"],
  remediation: string,
): CheckResult {
  return {
    checkId: input.check.id,
    title: input.check.title,
    status,
    severity,
    summary,
    evidence,
    remediation,
  };
}

async function executeLinuxCheck(input: SshCheckInput): Promise<CheckResult> {
  switch (input.check.id) {
    case "linux.cpu.usage": {
      const output = await sshOutput(
        input.asset,
        "sh -lc \"if command -v vmstat >/dev/null 2>&1; then vmstat 1 2 | tail -1 | awk '{print 100-$15}'; elif command -v top >/dev/null 2>&1; then top -bn2 | grep 'Cpu(s)' | tail -1 | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100-$1}'; else echo unsupported; fi\"",
        input.check.id,
      );

      if (output === "unsupported") {
        return normalizedResult(
          input,
          "unknown",
          "warning",
          "CPU usage could not be collected because neither vmstat nor top is available.",
          [{ label: "Collector", value: "missing vmstat/top" }],
          "Install procps or provide a supported CPU metrics command on the host.",
        );
      }

      const usage = Number.parseFloat(output);
      if (Number.isNaN(usage)) {
        throw new Error(`Unable to parse CPU usage output: ${output}`);
      }

      if (usage >= 85) {
        return normalizedResult(
          input,
          "critical",
          "critical",
          `CPU usage is high at ${usage.toFixed(1)}%.`,
          [{ label: "Usage", value: `${usage.toFixed(1)}%` }],
          "Inspect top CPU-consuming processes and review workload spikes.",
        );
      }

      if (usage >= 70) {
        return normalizedResult(
          input,
          "warning",
          "warning",
          `CPU usage is elevated at ${usage.toFixed(1)}%.`,
          [{ label: "Usage", value: `${usage.toFixed(1)}%` }],
          "Inspect top CPU-consuming processes and review workload spikes.",
        );
      }

      return normalizedResult(
        input,
        "pass",
        "info",
        `CPU usage is within range at ${usage.toFixed(1)}%.`,
        [{ label: "Usage", value: `${usage.toFixed(1)}%` }],
        "Inspect top CPU-consuming processes and review workload spikes.",
      );
    }
    case "linux.memory.usage": {
      const output = await sshOutput(
        input.asset,
        "sh -lc \"free -m | awk '/Mem:/ {printf \\\"%s %s %s\\\", $2, $3, ($3*100)/$2}'\"",
        input.check.id,
      );
      const parts = output.split(/\s+/);
      if (parts.length !== 3) {
        throw new Error(`Unexpected memory output: ${output}`);
      }

      const usage = Number.parseFloat(parts[2]);
      if (Number.isNaN(usage)) {
        throw new Error(`Unable to parse memory usage output: ${output}`);
      }

      const evidence = [
        { label: "Usage", value: `${usage.toFixed(1)}%` },
        { label: "Used Memory", value: `${parts[1]} MiB` },
        { label: "Total Memory", value: `${parts[0]} MiB` },
      ];

      if (usage >= 90) {
        return normalizedResult(
          input,
          "critical",
          "critical",
          `Memory usage is high at ${usage.toFixed(1)}%.`,
          evidence,
          "Review large processes, memory leaks, and swap activity if usage remains elevated.",
        );
      }

      if (usage >= 75) {
        return normalizedResult(
          input,
          "warning",
          "warning",
          `Memory usage is elevated at ${usage.toFixed(1)}%.`,
          evidence,
          "Review large processes, memory leaks, and swap activity if usage remains elevated.",
        );
      }

      return normalizedResult(
        input,
        "pass",
        "info",
        `Memory usage is within range at ${usage.toFixed(1)}%.`,
        evidence,
        "Review large processes, memory leaks, and swap activity if usage remains elevated.",
      );
    }
    case "linux.disk.usage": {
      const output = await sshOutput(
        input.asset,
        "sh -lc \"df -P / | awk 'NR==2 {gsub(/%/, \\\"\\\", $5); printf \\\"%s %s %s\\\", $2, $3, $5}'\"",
        input.check.id,
      );
      const parts = output.split(/\s+/);
      if (parts.length !== 3) {
        throw new Error(`Unexpected disk output: ${output}`);
      }

      const usage = Number.parseFloat(parts[2]);
      if (Number.isNaN(usage)) {
        throw new Error(`Unable to parse disk usage output: ${output}`);
      }

      const evidence = [
        { label: "Usage", value: `${usage.toFixed(1)}%` },
        { label: "Used Blocks", value: parts[1] },
        { label: "Total Blocks", value: parts[0] },
      ];

      if (usage >= 90) {
        return normalizedResult(
          input,
          "critical",
          "critical",
          `Root filesystem usage is high at ${usage.toFixed(1)}%.`,
          evidence,
          "Review filesystem growth, log retention, and cleanup opportunities on the root volume.",
        );
      }

      if (usage >= 80) {
        return normalizedResult(
          input,
          "warning",
          "warning",
          `Root filesystem usage is elevated at ${usage.toFixed(1)}%.`,
          evidence,
          "Review filesystem growth, log retention, and cleanup opportunities on the root volume.",
        );
      }

      return normalizedResult(
        input,
        "pass",
        "info",
        `Root filesystem usage is within range at ${usage.toFixed(1)}%.`,
        evidence,
        "Review filesystem growth, log retention, and cleanup opportunities on the root volume.",
      );
    }
    case "linux.load.average": {
      const output = await sshOutput(
        input.asset,
        "sh -lc \"cat /proc/loadavg | awk '{printf \\\"%s %s %s\\\", $1, $2, $3}'\"",
        input.check.id,
      );
      const parts = output.split(/\s+/);
      if (parts.length !== 3) {
        throw new Error(`Unexpected load output: ${output}`);
      }

      const load1 = Number.parseFloat(parts[0]);
      const load5 = Number.parseFloat(parts[1]);
      const load15 = Number.parseFloat(parts[2]);
      if ([load1, load5, load15].some((value) => Number.isNaN(value))) {
        throw new Error(`Unable to parse load output: ${output}`);
      }

      const evidence = [
        { label: "Load 1m", value: load1.toFixed(2) },
        { label: "Load 5m", value: load5.toFixed(2) },
        { label: "Load 15m", value: load15.toFixed(2) },
      ];

      if (load1 >= 4) {
        return normalizedResult(
          input,
          "critical",
          "critical",
          `Load average is high at ${load1.toFixed(2)}.`,
          evidence,
          "Review CPU saturation, blocked IO, and queued work if load remains elevated.",
        );
      }

      if (load1 >= 2) {
        return normalizedResult(
          input,
          "warning",
          "warning",
          `Load average is elevated at ${load1.toFixed(2)}.`,
          evidence,
          "Review CPU saturation, blocked IO, and queued work if load remains elevated.",
        );
      }

      return normalizedResult(
        input,
        "pass",
        "info",
        `Load average is within range at ${load1.toFixed(2)}.`,
        evidence,
        "Review CPU saturation, blocked IO, and queued work if load remains elevated.",
      );
    }
    case "linux.time.sync": {
      const output = await sshOutput(
        input.asset,
        "sh -lc \"if command -v timedatectl >/dev/null 2>&1; then timedatectl show -p NTPSynchronized --value; else echo unknown; fi\"",
        input.check.id,
      );
      const lowered = output.toLowerCase();

      if (lowered === "yes") {
        return normalizedResult(
          input,
          "pass",
          "info",
          "Host clock is synchronized.",
          [{ label: "NTPSynchronized", value: output }],
          "No action required.",
        );
      }

      if (lowered === "no") {
        return normalizedResult(
          input,
          "critical",
          "critical",
          "Host clock is not synchronized.",
          [{ label: "NTPSynchronized", value: output }],
          "Verify chronyd or systemd-timesyncd configuration and re-sync the host clock.",
        );
      }

      return normalizedResult(
        input,
        "unknown",
        "warning",
        "Time synchronization state could not be determined.",
        [{ label: "Collector", value: output }],
        "Verify whether timedatectl is available and confirm the host time service status.",
      );
    }
    case "linux.process.sshd": {
      const output = await sshOutput(
        input.asset,
        "sh -lc \"pgrep -x sshd >/dev/null && echo running || echo stopped\"",
        input.check.id,
      );

      if (output === "running") {
        return normalizedResult(
          input,
          "pass",
          "info",
          "sshd is running.",
          [{ label: "Process", value: "sshd" }],
          "No action required.",
        );
      }

      return normalizedResult(
        input,
        "critical",
        "critical",
        "sshd is not running.",
        [{ label: "Process", value: "sshd" }],
        "Start sshd and verify the service is enabled if remote access is expected.",
      );
    }
    case "linux.port.22": {
      const output = await sshOutput(
        input.asset,
        "sh -lc \"if command -v ss >/dev/null 2>&1; then ss -ltn '( sport = :22 )' | tail -n +2 | wc -l; elif command -v netstat >/dev/null 2>&1; then netstat -ltn | awk '$4 ~ /:22$/ {count++} END {print count+0}'; else echo unsupported; fi\"",
        input.check.id,
      );

      if (output === "unsupported") {
        return normalizedResult(
          input,
          "unknown",
          "warning",
          "Listening port state could not be collected because ss/netstat is unavailable.",
          [{ label: "Collector", value: "missing ss/netstat" }],
          "Install iproute2 or net-tools to allow port inspection.",
        );
      }

      const listeners = Number.parseInt(output, 10);
      if (Number.isNaN(listeners)) {
        throw new Error(`Unable to parse port listener output: ${output}`);
      }

      if (listeners > 0) {
        return normalizedResult(
          input,
          "pass",
          "info",
          "Port 22 is listening.",
          [{ label: "Port", value: "22/tcp" }],
          "No action required.",
        );
      }

      return normalizedResult(
        input,
        "critical",
        "critical",
        "Port 22 is not listening.",
        [{ label: "Port", value: "22/tcp" }],
        "Verify sshd is running and listening on the expected interface and port.",
      );
    }
    case "linux.reboot.age": {
      const output = await sshOutput(
        input.asset,
        "sh -lc \"if command -v who >/dev/null 2>&1; then who -b | sed 's/.*system boot  *//'; else uptime -s; fi\"",
        input.check.id,
      );

      return normalizedResult(
        input,
        "pass",
        "info",
        "Recent reboot information was collected successfully.",
        [{ label: "Last Boot", value: output }],
        "Review reboot timing if unexpected restarts are observed.",
      );
    }
    case "linux.log.usage": {
      const output = await sshOutput(
        input.asset,
        "sh -lc \"df -P /var/log | awk 'NR==2 {gsub(/%/, \\\"\\\", $5); printf \\\"%s %s %s\\\", $2, $3, $5}'\"",
        input.check.id,
      );
      const parts = output.split(/\s+/);
      if (parts.length !== 3) {
        throw new Error(`Unexpected /var/log output: ${output}`);
      }

      const usage = Number.parseFloat(parts[2]);
      if (Number.isNaN(usage)) {
        throw new Error(`Unable to parse /var/log usage output: ${output}`);
      }

      const evidence = [
        { label: "Usage", value: `${usage.toFixed(1)}%` },
        { label: "Used Blocks", value: parts[1] },
        { label: "Total Blocks", value: parts[0] },
      ];

      if (usage >= 85) {
        return normalizedResult(
          input,
          "critical",
          "critical",
          `/var/log usage is high at ${usage.toFixed(1)}%.`,
          evidence,
          "Review log rotation, retention, and oversized log files in /var/log.",
        );
      }

      if (usage >= 70) {
        return normalizedResult(
          input,
          "warning",
          "warning",
          `/var/log usage is elevated at ${usage.toFixed(1)}%.`,
          evidence,
          "Review log rotation, retention, and oversized log files in /var/log.",
        );
      }

      return normalizedResult(
        input,
        "pass",
        "info",
        `/var/log usage is within range at ${usage.toFixed(1)}%.`,
        evidence,
        "Review log rotation, retention, and oversized log files in /var/log.",
      );
    }
    default:
      return normalizedResult(
        input,
        "unknown",
        "warning",
        `Check ${input.check.id} is not implemented in the local-service SSH runner yet.`,
        [{ label: "Check", value: input.check.id }],
        "Implement the missing SSH command mapping for this check.",
      );
  }
}

export class LocalServicePreviewAdapter implements RunnerAdapter {
  async testConnection(asset: Asset): Promise<SshConnectionTestResult> {
    return {
      ok: true,
      message: `Local service preview accepted ${asset.host}:${asset.port} for orchestration.`,
    };
  }
}

export class LocalServiceSshRunnerAdapter implements RunnerAdapter {
  async testConnection(asset: Asset): Promise<SshConnectionTestResult> {
    try {
      validateSshAsset(asset);
      const output = await runSshCommand(asset, "exit");
      return {
        ok: output.ok,
        message: output.ok
          ? `SSH connectivity to ${asset.host}:${asset.port} succeeded.`
          : output.stderr || `SSH connectivity to ${asset.host}:${asset.port} failed.`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "SSH connectivity test failed.";
      return {
        ok: false,
        message,
      };
    }
  }

  async executeCheck(asset: Asset, check: CheckDefinition): Promise<CheckResult> {
    try {
      return await executeLinuxCheck({ asset, check });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Check execution failed.";
      return {
        checkId: check.id,
        title: check.title,
        status: "unknown",
        severity: "warning",
        summary: message,
        evidence: [{ label: "Execution", value: "Failed before result normalization" }],
        remediation: "Verify SSH connectivity, command availability, and host permissions.",
      };
    }
  }
}
