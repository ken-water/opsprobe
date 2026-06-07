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

type EvaluatedCheckDetails = Pick<CheckResult, "status" | "severity" | "summary" | "evidence" | "remediation">;

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

async function mysqlShellOutput(asset: Asset, shellScript: string, checkId: string): Promise<string> {
  const output = await sshOutput(asset, `sh -lc "${shellScript}"`, checkId);

  if (output.startsWith("__opsprobe_missing_mysql_client__")) {
    throw new Error("MySQL client is not available on the host.");
  }

  if (output.startsWith("__opsprobe_mysql_query_failed__")) {
    const detail = output
      .split("\n")
      .slice(1)
      .join(" ")
      .trim();
    throw new Error(detail || "MySQL query execution failed.");
  }

  return output;
}

function parseMysqlKeyValueRows(output: string) {
  return new Map(
    output
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.split("\t"))
      .filter((parts) => parts.length >= 2)
      .map(([key, value]) => [key, value] as const),
  );
}

export function evaluateMysqlConnectionPressure(output: string): EvaluatedCheckDetails {
  const rows = parseMysqlKeyValueRows(output);
  const threadsConnected = Number.parseInt(rows.get("Threads_connected") ?? "", 10);
  const threadsRunning = Number.parseInt(rows.get("Threads_running") ?? "", 10);
  const maxUsedConnections = Number.parseInt(rows.get("Max_used_connections") ?? "", 10);
  const maxConnections = Number.parseInt(rows.get("max_connections") ?? "", 10);

  if ([threadsConnected, threadsRunning, maxUsedConnections, maxConnections].some((value) => Number.isNaN(value))) {
    throw new Error(`Unexpected MySQL connection pressure output: ${output}`);
  }

  const utilization = maxConnections > 0 ? (maxUsedConnections / maxConnections) * 100 : 0;
  const evidence = [
    { label: "Threads Connected", value: String(threadsConnected) },
    { label: "Threads Running", value: String(threadsRunning) },
    { label: "Max Used Connections", value: String(maxUsedConnections) },
    { label: "max_connections", value: String(maxConnections) },
    { label: "Peak Utilization", value: `${utilization.toFixed(1)}%` },
  ];

  if (utilization >= 85 || threadsRunning >= 32) {
    return {
      status: "critical",
      severity: "critical",
      summary: `MySQL connection pressure is high at ${utilization.toFixed(1)}% of max_connections.`,
      evidence,
      remediation:
        "Review connection pooling, long-running sessions, and whether max_connections or application concurrency limits need immediate adjustment.",
    };
  }

  if (utilization >= 65 || threadsRunning >= 16) {
    return {
      status: "warning",
      severity: "warning",
      summary: `MySQL connection pressure is elevated at ${utilization.toFixed(1)}% of max_connections.`,
      evidence,
      remediation:
        "Review idle session cleanup, burst traffic, and pool sizing before connection pressure reaches availability risk.",
    };
  }

  return {
    status: "pass",
    severity: "info",
    summary: `MySQL connection pressure is within range at ${utilization.toFixed(1)}% of max_connections.`,
    evidence,
    remediation: "Review connection pooling and session churn if workload patterns change materially.",
  };
}

export function evaluateMysqlReplicationHints(output: string): EvaluatedCheckDetails {
  const readOnlyMatch = output.match(/read_only\t([^\n]+)/);
  const superReadOnlyMatch = output.match(/super_read_only\t([^\n]+)/);
  const ioMatch = output.match(/(?:Replica_IO_Running|Slave_IO_Running):\s*(\S+)/);
  const sqlMatch = output.match(/(?:Replica_SQL_Running|Slave_SQL_Running):\s*(\S+)/);
  const lagMatch = output.match(/(?:Seconds_Behind_Source|Seconds_Behind_Master):\s*(\S+)/);
  const sourceHostMatch = output.match(/(?:Source_Host|Master_Host):\s*(\S+)/);

  const readOnly = readOnlyMatch?.[1] ?? "unknown";
  const superReadOnly = superReadOnlyMatch?.[1] ?? "unknown";
  const ioState = ioMatch?.[1] ?? "not-reported";
  const sqlState = sqlMatch?.[1] ?? "not-reported";
  const lag = lagMatch?.[1] ?? "not-reported";
  const sourceHost = sourceHostMatch?.[1] ?? "standalone-or-primary";
  const evidence = [
    { label: "read_only", value: readOnly },
    { label: "super_read_only", value: superReadOnly },
    { label: "Replica IO", value: ioState },
    { label: "Replica SQL", value: sqlState },
    { label: "Lag", value: lag },
    { label: "Upstream", value: sourceHost },
  ];

  if ((ioState === "No" || sqlState === "No") && sourceHost !== "standalone-or-primary") {
    return {
      status: "critical",
      severity: "critical",
      summary: "MySQL replica health is degraded.",
      evidence,
      remediation:
        "Inspect replica IO or SQL thread failures, relay-log errors, and upstream reachability before relying on this node for failover or read traffic.",
    };
  }

  if ((readOnly === "ON" || superReadOnly === "ON") && sourceHost === "standalone-or-primary") {
    return {
      status: "warning",
      severity: "warning",
      summary: "MySQL is read-only but no replica status was reported.",
      evidence,
      remediation:
        "Confirm whether this host is intentionally pinned read-only or whether replica configuration drift removed expected upstream state.",
    };
  }

  return {
    status: "pass",
    severity: "info",
    summary:
      sourceHost === "standalone-or-primary"
        ? "MySQL appears to be standalone or primary with no replica status reported."
        : "MySQL replication hints were collected successfully.",
    evidence,
    remediation: "Review replica lag, read-only posture, and upstream state if this host participates in replication.",
  };
}

export function evaluateMysqlSlowQueryRisk(output: string): EvaluatedCheckDetails {
  const rows = parseMysqlKeyValueRows(output);
  const slowQueryLog = (rows.get("slow_query_log") ?? "unknown").toUpperCase();
  const longQueryTime = Number.parseFloat(rows.get("long_query_time") ?? "");
  const slowQueries = Number.parseInt(rows.get("Slow_queries") ?? "", 10);
  const logOutput = rows.get("log_output") ?? "unknown";

  if (Number.isNaN(longQueryTime) || Number.isNaN(slowQueries)) {
    throw new Error(`Unexpected MySQL slow-query output: ${output}`);
  }

  const evidence = [
    { label: "slow_query_log", value: slowQueryLog },
    { label: "long_query_time", value: String(longQueryTime) },
    { label: "log_output", value: logOutput },
    { label: "Slow_queries", value: String(slowQueries) },
  ];

  if (slowQueryLog !== "ON") {
    return {
      status: "warning",
      severity: "warning",
      summary: "MySQL slow-query logging is disabled.",
      evidence,
      remediation:
        "Enable slow-query logging or confirm an alternative query-observability path before recurring performance issues become harder to diagnose.",
    };
  }

  if (slowQueries >= 1000 || longQueryTime > 5) {
    return {
      status: "warning",
      severity: "warning",
      summary: "MySQL slow-query risk should be reviewed.",
      evidence,
      remediation:
        "Review accumulated slow-query count, tune long_query_time for your workload, and inspect repeated expensive query patterns.",
    };
  }

  return {
    status: "pass",
    severity: "info",
    summary: "MySQL slow-query posture is within the expected range.",
    evidence,
    remediation: "Continue reviewing slow-query growth during recurring performance checks.",
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
    case "linux.mysql.process": {
      const output = await sshOutput(
        input.asset,
        "sh -lc \"pgrep -x mysqld >/dev/null || pgrep -x mariadbd >/dev/null && echo running || echo stopped\"",
        input.check.id,
      );

      if (output === "running") {
        return normalizedResult(
          input,
          "pass",
          "info",
          "mysql or mariadb process is running.",
          [{ label: "Process", value: "mysqld or mariadbd" }],
          "No action required.",
        );
      }

      return normalizedResult(
        input,
        "critical",
        "critical",
        "mysql or mariadb process is not running.",
        [{ label: "Process", value: "mysqld or mariadbd" }],
        "Start the database service and verify service-manager or container restart expectations.",
      );
    }
    case "linux.mysql.port.3306": {
      const output = await sshOutput(
        input.asset,
        "sh -lc \"if command -v ss >/dev/null 2>&1; then ss -ltn '( sport = :3306 )' | tail -n +2 | wc -l; elif command -v netstat >/dev/null 2>&1; then netstat -ltn | awk '$4 ~ /:3306$/ {count++} END {print count+0}'; else echo unsupported; fi\"",
        input.check.id,
      );

      if (output === "unsupported") {
        return normalizedResult(
          input,
          "unknown",
          "warning",
          "MySQL listener state could not be collected because ss/netstat is unavailable.",
          [{ label: "Collector", value: "missing ss/netstat" }],
          "Install iproute2 or net-tools to allow listener inspection.",
        );
      }

      const listeners = Number.parseInt(output, 10);
      if (Number.isNaN(listeners)) {
        throw new Error(`Unable to parse MySQL listener output: ${output}`);
      }

      if (listeners > 0) {
        return normalizedResult(
          input,
          "pass",
          "info",
          "Port 3306 is listening.",
          [{ label: "Port", value: "3306/tcp" }],
          "No action required.",
        );
      }

      return normalizedResult(
        input,
        "critical",
        "critical",
        "Port 3306 is not listening.",
        [{ label: "Port", value: "3306/tcp" }],
        "Verify database bind-address, service state, and whether MySQL is expected to accept TCP connections on this host.",
      );
    }
    case "linux.mysql.runtime.info": {
      const output = await mysqlShellOutput(
        input.asset,
        "client=''; if command -v mysql >/dev/null 2>&1; then client=mysql; elif command -v mariadb >/dev/null 2>&1; then client=mariadb; else echo __opsprobe_missing_mysql_client__; exit 0; fi; output=$($client --batch --raw --skip-column-names -e \\\"select @@version, @@version_comment, @@datadir, @@read_only, @@innodb_buffer_pool_size;\\\" 2>&1); status=$?; if [ $status -ne 0 ]; then printf '__opsprobe_mysql_query_failed__\\n%s\\n' \"$output\"; exit 0; fi; printf '%s\\n' \"$output\"",
        input.check.id,
      );
      const parts = output.split("\t");
      if (parts.length < 5) {
        throw new Error(`Unexpected MySQL runtime output: ${output}`);
      }

      return normalizedResult(
        input,
        "pass",
        "info",
        "MySQL runtime configuration was collected successfully.",
        [
          { label: "Version", value: parts[0] },
          { label: "Distribution", value: parts[1] },
          { label: "Data Directory", value: parts[2] },
          { label: "read_only", value: parts[3] },
          { label: "InnoDB Buffer Pool", value: `${parts[4]} bytes` },
        ],
        "Review role and write-path expectations if read-only posture or data-directory placement differs from the intended database role.",
      );
    }
    case "linux.mysql.schema.inventory": {
      const output = await mysqlShellOutput(
        input.asset,
        "client=''; if command -v mysql >/dev/null 2>&1; then client=mysql; elif command -v mariadb >/dev/null 2>&1; then client=mariadb; else echo __opsprobe_missing_mysql_client__; exit 0; fi; output=$($client --batch --raw --skip-column-names -e \\\"select count(*), coalesce(group_concat(schema_name order by schema_name separator ', '), '') from information_schema.schemata where schema_name not in ('information_schema','mysql','performance_schema','sys');\\\" 2>&1); status=$?; if [ $status -ne 0 ]; then printf '__opsprobe_mysql_query_failed__\\n%s\\n' \"$output\"; exit 0; fi; printf '%s\\n' \"$output\"",
        input.check.id,
      );
      const parts = output.split("\t");
      if (parts.length < 2) {
        throw new Error(`Unexpected MySQL schema inventory output: ${output}`);
      }

      const count = Number.parseInt(parts[0], 10);
      if (Number.isNaN(count)) {
        throw new Error(`Unable to parse MySQL schema count: ${output}`);
      }

      return normalizedResult(
        input,
        "pass",
        "info",
        count === 0
          ? "No non-system MySQL schemas were found."
          : `Collected inventory for ${count} non-system MySQL schema(s).`,
        [
          { label: "Schema Count", value: String(count) },
          { label: "Sample Schemas", value: parts[1] || "none" },
        ],
        "Review unexpected schema growth, missing tenant schemas, or leftover temporary databases before the next maintenance window.",
      );
    }
    case "linux.mysql.connection.pressure": {
      const output = await mysqlShellOutput(
        input.asset,
        "client=''; if command -v mysql >/dev/null 2>&1; then client=mysql; elif command -v mariadb >/dev/null 2>&1; then client=mariadb; else echo __opsprobe_missing_mysql_client__; exit 0; fi; output=$($client --batch --raw --skip-column-names -e \\\"show global status like 'Threads_connected'; show global status like 'Threads_running'; show global status like 'Max_used_connections'; show variables like 'max_connections';\\\" 2>&1); status=$?; if [ $status -ne 0 ]; then printf '__opsprobe_mysql_query_failed__\\n%s\\n' \"$output\"; exit 0; fi; printf '%s\\n' \"$output\"",
        input.check.id,
      );
      const evaluation = evaluateMysqlConnectionPressure(output);
      return normalizedResult(
        input,
        evaluation.status,
        evaluation.severity,
        evaluation.summary,
        evaluation.evidence,
        evaluation.remediation,
      );
    }
    case "linux.mysql.replication.hints": {
      const output = await mysqlShellOutput(
        input.asset,
        "client=''; if command -v mysql >/dev/null 2>&1; then client=mysql; elif command -v mariadb >/dev/null 2>&1; then client=mariadb; else echo __opsprobe_missing_mysql_client__; exit 0; fi; output=$($client --batch --raw --skip-column-names -e \\\"show variables like 'read_only'; show variables like 'super_read_only'; show replica status\\\\G; show slave status\\\\G;\\\" 2>&1); status=$?; if [ $status -ne 0 ]; then printf '__opsprobe_mysql_query_failed__\\n%s\\n' \"$output\"; exit 0; fi; printf '%s\\n' \"$output\"",
        input.check.id,
      );
      const evaluation = evaluateMysqlReplicationHints(output);
      return normalizedResult(
        input,
        evaluation.status,
        evaluation.severity,
        evaluation.summary,
        evaluation.evidence,
        evaluation.remediation,
      );
    }
    case "linux.mysql.slow-query.risk": {
      const output = await mysqlShellOutput(
        input.asset,
        "client=''; if command -v mysql >/dev/null 2>&1; then client=mysql; elif command -v mariadb >/dev/null 2>&1; then client=mariadb; else echo __opsprobe_missing_mysql_client__; exit 0; fi; output=$($client --batch --raw --skip-column-names -e \\\"show variables like 'slow_query_log'; show variables like 'long_query_time'; show variables like 'log_output'; show global status like 'Slow_queries';\\\" 2>&1); status=$?; if [ $status -ne 0 ]; then printf '__opsprobe_mysql_query_failed__\\n%s\\n' \"$output\"; exit 0; fi; printf '%s\\n' \"$output\"",
        input.check.id,
      );
      const evaluation = evaluateMysqlSlowQueryRisk(output);
      return normalizedResult(
        input,
        evaluation.status,
        evaluation.severity,
        evaluation.summary,
        evaluation.evidence,
        evaluation.remediation,
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
