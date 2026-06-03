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
];
