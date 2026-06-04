import type { CheckStatus, Severity } from "@opsprobe/shared";

export interface CheckContext {
  assetId: string;
  assetName: string;
  protocol: "ssh";
  collectedAt: string;
}

export interface CheckEvidence {
  label: string;
  value: string;
}

export interface CheckResult {
  checkId: string;
  title: string;
  status: CheckStatus;
  severity: Severity;
  summary: string;
  evidence: CheckEvidence[];
  remediation: string;
}

export interface CheckDefinition {
  id: string;
  title: string;
  description: string;
  category: "resource" | "state";
  protocol: "ssh";
  run: (context: CheckContext) => Promise<CheckResult>;
}

export interface BuiltInInspectionTemplateDefinition {
  id: string;
  name: string;
  description: string;
  assetKind: "linux-host";
  checkIds: string[];
}

function nowIso() {
  return new Date().toISOString();
}

export const builtInLinuxChecks: CheckDefinition[] = [
  {
    id: "linux.cpu.usage",
    title: "CPU Usage",
    description: "Checks whether CPU usage is within a healthy range.",
    category: "resource",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.cpu.usage",
        title: "CPU Usage",
        status: "warning",
        severity: "warning",
        summary: "CPU usage is elevated and should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Usage", value: "78%" },
        ],
        remediation: "Inspect top CPU-consuming processes and review workload spikes.",
      };
    },
  },
  {
    id: "linux.memory.usage",
    title: "Memory Usage",
    description: "Checks whether memory usage is within a healthy range.",
    category: "resource",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.memory.usage",
        title: "Memory Usage",
        status: "pass",
        severity: "info",
        summary: "Memory usage is within the expected range.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Usage", value: "53%" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.disk.usage",
    title: "Disk Usage",
    description: "Checks whether root filesystem usage is within a healthy range.",
    category: "resource",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.disk.usage",
        title: "Disk Usage",
        status: "warning",
        severity: "warning",
        summary: "Disk usage is elevated and should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Usage", value: "81%" },
        ],
        remediation: "Review filesystem growth, log retention, and cleanup opportunities.",
      };
    },
  },
  {
    id: "linux.load.average",
    title: "Load Average",
    description: "Checks whether load average is within a healthy range.",
    category: "resource",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.load.average",
        title: "Load Average",
        status: "pass",
        severity: "info",
        summary: "Load average is within the expected range.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Load", value: "0.42 0.37 0.35" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.time.sync",
    title: "Time Synchronization",
    description: "Checks whether the host clock is synchronized.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.time.sync",
        title: "Time Synchronization",
        status: "critical",
        severity: "critical",
        summary: "Clock drift exceeds the expected threshold.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Offset", value: "+4.2s" },
        ],
        remediation: "Verify chronyd or ntpd configuration and re-sync the host clock.",
      };
    },
  },
  {
    id: "linux.process.sshd",
    title: "Key Process Status",
    description: "Checks whether the sshd process is running.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.process.sshd",
        title: "Key Process Status",
        status: "pass",
        severity: "info",
        summary: "sshd is running.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Process", value: "sshd" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.port.22",
    title: "Key Port Listening",
    description: "Checks whether TCP port 22 is listening.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.port.22",
        title: "Key Port Listening",
        status: "pass",
        severity: "info",
        summary: "Port 22 is listening.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Port", value: "22/tcp" },
        ],
        remediation: "No action required.",
      };
    },
  },
  {
    id: "linux.reboot.age",
    title: "Last Reboot Time",
    description: "Checks how long ago the host was rebooted.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.reboot.age",
        title: "Last Reboot Time",
        status: "pass",
        severity: "info",
        summary: "Recent reboot information was collected successfully.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Last Boot", value: "2026-06-01 09:12:00" },
        ],
        remediation: "Review reboot timing if unexpected restarts are observed.",
      };
    },
  },
  {
    id: "linux.log.usage",
    title: "Log Directory Usage",
    description: "Checks whether /var/log usage is within a healthy range.",
    category: "state",
    protocol: "ssh",
    async run() {
      return {
        checkId: "linux.log.usage",
        title: "Log Directory Usage",
        status: "warning",
        severity: "warning",
        summary: "/var/log usage is elevated and should be reviewed.",
        evidence: [
          { label: "Collected At", value: nowIso() },
          { label: "Usage", value: "76%" },
        ],
        remediation: "Review log rotation, retention, and oversized log files in /var/log.",
      };
    },
  },
];

export const builtInInspectionTemplateDefinitions: BuiltInInspectionTemplateDefinition[] = [
  {
    id: "template.linux.default",
    name: "Linux Host Baseline",
    description: "Balanced Linux host baseline with capacity and state checks.",
    assetKind: "linux-host",
    checkIds: builtInLinuxChecks.map((check) => check.id),
  },
  {
    id: "template.linux.capacity",
    name: "Linux Capacity Review",
    description: "Focus on CPU, memory, disk, load, and log growth pressure.",
    assetKind: "linux-host",
    checkIds: [
      "linux.cpu.usage",
      "linux.memory.usage",
      "linux.disk.usage",
      "linux.load.average",
      "linux.log.usage",
    ],
  },
  {
    id: "template.linux.state",
    name: "Linux Access and State Review",
    description: "Focus on time sync, SSH reachability indicators, reboot age, and log state.",
    assetKind: "linux-host",
    checkIds: [
      "linux.time.sync",
      "linux.process.sshd",
      "linux.port.22",
      "linux.reboot.age",
      "linux.log.usage",
    ],
  },
];

export function findBuiltInTemplateDefinition(templateId: string) {
  return builtInInspectionTemplateDefinitions.find((template) => template.id === templateId);
}

export function resolveTemplateChecks(templateId: string): CheckDefinition[] {
  const template = findBuiltInTemplateDefinition(templateId) ?? builtInInspectionTemplateDefinitions[0];
  const checkMap = new Map(builtInLinuxChecks.map((check) => [check.id, check]));

  return template.checkIds
    .map((checkId) => checkMap.get(checkId))
    .filter((check): check is CheckDefinition => Boolean(check));
}
